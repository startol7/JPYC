// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title JPYCSurveyContract
 * @dev アンケート回答でJPYCを配布するスマートコントラクト
 */
contract JPYCSurveyContract is Ownable, ReentrancyGuard, Pausable {
    
    // JPYCトークンのインターフェース
    IERC20 public jpycToken;
    
    // アンケート構造体
    struct Survey {
        uint256 id;
        string title;
        string ipfsHash;  // 質問データはIPFSに保存
        uint256 reward;   // JPYC報酬額
        uint256 maxResponses;  // 最大回答数
        uint256 currentResponses;  // 現在の回答数
        bool isActive;
        address creator;
        uint256 createdAt;
        uint256 endDate;
    }
    
    // 回答構造体
    struct Response {
        uint256 surveyId;
        address respondent;
        string answerHash;  // 回答データのIPFSハッシュ
        uint256 timestamp;
        bool isRewarded;
    }
    
    // Storage
    uint256 public nextSurveyId = 1;
    mapping(uint256 => Survey) public surveys;
    mapping(address => mapping(uint256 => bool)) public hasResponded;
    mapping(address => uint256) public totalEarnings;
    mapping(address => uint256) public responseCount;
    mapping(uint256 => Response[]) public surveyResponses;
    
    // Events
    event SurveyCreated(
        uint256 indexed surveyId,
        address indexed creator,
        string title,
        uint256 reward
    );
    
    event SurveyCompleted(
        uint256 indexed surveyId,
        address indexed respondent,
        uint256 reward
    );
    
    event RewardClaimed(
        address indexed user,
        uint256 amount
    );
    
    event SurveyDeactivated(
        uint256 indexed surveyId
    );
    
    // Modifiers
    modifier surveyExists(uint256 _surveyId) {
        require(surveys[_surveyId].id != 0, "Survey does not exist");
        _;
    }
    
    modifier surveyActive(uint256 _surveyId) {
        require(surveys[_surveyId].isActive, "Survey is not active");
        require(
            block.timestamp <= surveys[_surveyId].endDate,
            "Survey has expired"
        );
        require(
            surveys[_surveyId].currentResponses < surveys[_surveyId].maxResponses,
            "Survey has reached max responses"
        );
        _;
    }
    
    modifier hasNotResponded(uint256 _surveyId) {
        require(
            !hasResponded[msg.sender][_surveyId],
            "Already responded to this survey"
        );
        _;
    }
    
    /**
     * @dev コンストラクタ
     * @param _jpycToken JPYCトークンのアドレス
     */
    constructor(address _jpycToken) {
        jpycToken = IERC20(_jpycToken);
    }
    
    /**
     * @dev 新しいアンケートを作成
     * @param _title アンケートのタイトル
     * @param _ipfsHash IPFSに保存された質問データのハッシュ
     * @param _reward 回答者への報酬額
     * @param _maxResponses 最大回答数
     * @param _duration アンケート期間（秒）
     */
    function createSurvey(
        string memory _title,
        string memory _ipfsHash,
        uint256 _reward,
        uint256 _maxResponses,
        uint256 _duration
    ) external whenNotPaused {
        require(_reward > 0, "Reward must be greater than 0");
        require(_maxResponses > 0, "Max responses must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        
        // 作成者がアンケート報酬の総額を保有していることを確認
        uint256 totalRewardAmount = _reward * _maxResponses;
        require(
            jpycToken.balanceOf(msg.sender) >= totalRewardAmount,
            "Insufficient JPYC balance"
        );
        
        // JPYCをコントラクトにデポジット
        require(
            jpycToken.transferFrom(msg.sender, address(this), totalRewardAmount),
            "JPYC transfer failed"
        );
        
        uint256 surveyId = nextSurveyId++;
        
        surveys[surveyId] = Survey({
            id: surveyId,
            title: _title,
            ipfsHash: _ipfsHash,
            reward: _reward,
            maxResponses: _maxResponses,
            currentResponses: 0,
            isActive: true,
            creator: msg.sender,
            createdAt: block.timestamp,
            endDate: block.timestamp + _duration
        });
        
        emit SurveyCreated(surveyId, msg.sender, _title, _reward);
    }
    
    /**
     * @dev アンケートに回答
     * @param _surveyId アンケートID
     * @param _answerHash 回答データのIPFSハッシュ
     */
    function submitResponse(
        uint256 _surveyId,
        string memory _answerHash
    ) external 
      nonReentrant 
      whenNotPaused
      surveyExists(_surveyId)
      surveyActive(_surveyId)
      hasNotResponded(_surveyId) 
    {
        Survey storage survey = surveys[_surveyId];
        
        // 回答を記録
        Response memory newResponse = Response({
            surveyId: _surveyId,
            respondent: msg.sender,
            answerHash: _answerHash,
            timestamp: block.timestamp,
            isRewarded: false
        });
        
        surveyResponses[_surveyId].push(newResponse);
        hasResponded[msg.sender][_surveyId] = true;
        survey.currentResponses++;
        responseCount[msg.sender]++;
        
        // 即座に報酬を送信
        _distributeReward(msg.sender, survey.reward);
        
        emit SurveyCompleted(_surveyId, msg.sender, survey.reward);
        
        // 最大回答数に達したらアンケートを終了
        if (survey.currentResponses >= survey.maxResponses) {
            survey.isActive = false;
            emit SurveyDeactivated(_surveyId);
        }
    }
    
    /**
     * @dev 報酬を配布
     * @param _recipient 受取人
     * @param _amount 金額
     */
    function _distributeReward(address _recipient, uint256 _amount) private {
        require(
            jpycToken.balanceOf(address(this)) >= _amount,
            "Insufficient contract balance"
        );
        
        totalEarnings[_recipient] += _amount;
        
        require(
            jpycToken.transfer(_recipient, _amount),
            "JPYC transfer failed"
        );
        
        emit RewardClaimed(_recipient, _amount);
    }
    
    /**
     * @dev アンケートを強制終了（作成者のみ）
     * @param _surveyId アンケートID
     */
    function deactivateSurvey(uint256 _surveyId) 
        external 
        surveyExists(_surveyId) 
    {
        Survey storage survey = surveys[_surveyId];
        require(
            msg.sender == survey.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(survey.isActive, "Survey already inactive");
        
        survey.isActive = false;
        
        // 未使用の報酬を作成者に返金
        uint256 remainingResponses = survey.maxResponses - survey.currentResponses;
        if (remainingResponses > 0) {
            uint256 refundAmount = remainingResponses * survey.reward;
            require(
                jpycToken.transfer(survey.creator, refundAmount),
                "Refund failed"
            );
        }
        
        emit SurveyDeactivated(_surveyId);
    }
    
    /**
     * @dev アクティブなアンケートを取得
     * @return activeSurveyIds アクティブなアンケートIDの配列
     */
    function getActiveSurveys() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // アクティブなアンケート数をカウント
        for (uint256 i = 1; i < nextSurveyId; i++) {
            if (surveys[i].isActive && 
                block.timestamp <= surveys[i].endDate &&
                surveys[i].currentResponses < surveys[i].maxResponses) {
                activeCount++;
            }
        }
        
        // アクティブなアンケートIDを配列に格納
        uint256[] memory activeSurveyIds = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextSurveyId; i++) {
            if (surveys[i].isActive && 
                block.timestamp <= surveys[i].endDate &&
                surveys[i].currentResponses < surveys[i].maxResponses) {
                activeSurveyIds[index] = i;
                index++;
            }
        }
        
        return activeSurveyIds;
    }
    
    /**
     * @dev ユーザーの統計情報を取得
     * @param _user ユーザーアドレス
     * @return earnings 総獲得額
     * @return responses 総回答数
     */
    function getUserStats(address _user) 
        external 
        view 
        returns (uint256 earnings, uint256 responses) 
    {
        return (totalEarnings[_user], responseCount[_user]);
    }
    
    /**
     * @dev アンケートの回答を取得
     * @param _surveyId アンケートID
     * @return responses 回答の配列
     */
    function getSurveyResponses(uint256 _surveyId) 
        external 
        view 
        surveyExists(_surveyId)
        returns (Response[] memory) 
    {
        return surveyResponses[_surveyId];
    }
    
    /**
     * @dev 緊急停止
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 緊急停止解除
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev コントラクトの残高を確認
     * @return balance JPYCの残高
     */
    function getContractBalance() external view returns (uint256) {
        return jpycToken.balanceOf(address(this));
    }
}