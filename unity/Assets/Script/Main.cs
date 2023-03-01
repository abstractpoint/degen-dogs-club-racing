using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class Main : MonoBehaviour
{

    //instance
    public static Main instance;
    //panels
    public GameObject indexScreen, ChallengeConfirmScreen, RaceScreen;
    //list container
    public Transform contentbox;
    //timer text
    public TextMeshProUGUI timer;
    //total time
    public float timeRemaining = 300;
    //round childCount
    public int roundNumber = 0;
    //time boolean
    private bool timerIsRunning = false;

    //index
    public string player, opponent;
    //list data prefab
    public GameObject playerDataPrefab;

    //nft images
    public Sprite playerimage, opponentimage;

    //strength
    public int playerstre, oppostre;

    //pot (Coins)
    public int playerPot, oppoPot;

    private void Awake()
    {
        //instance
        instance = this;

        //Refresh Main screen with initial data
        ChallengeConfirmScreen.SetActive(false);
        indexScreen.SetActive(true);
        RaceScreen.SetActive(false);
        OnRefreshPanel();
    }

    // Start is called before the first frame update
    void Start()
    {
        // Starts the timer automatically
        timerIsRunning = true;
    }

    // Update is called once per frame
    void Update()
    {
        //if timer is running
        if (timerIsRunning)
        {
            //if timer is greter than 0
            if (timeRemaining > 0)
            {
                //decrease timer
                timeRemaining -= Time.deltaTime;
                //display time
                DisplayTime(timeRemaining);
            }
            //if time is 0
            else
            {
                Debug.Log("Time has run out!");
                timeRemaining = 0;
                timerIsRunning = false;
                //Reset timer
                ResetTimer();
                //OnRefreshPanel();
            }
        }
    }

    //Display time
    void DisplayTime(float timeToDisplay)
    {
        //Convert time to hour and minute format
        timeToDisplay += 1;
        float minutes = Mathf.FloorToInt(timeToDisplay / 60);
        float seconds = Mathf.FloorToInt(timeToDisplay % 60);
        timer.text = string.Format("Round {2} - {0:0}m{1:00}s", minutes, seconds, roundNumber);
    }

    //Reset time
    void ResetTimer()
    {
        //time to 5 min & on index screen
        timeRemaining = 300;
        timerIsRunning = true;
        indexScreen.SetActive(true);
        ChallengeConfirmScreen.SetActive(false);
        //incr round number
        roundNumber += 1;
    }

    //on click challenge
    public void OnSetChallenge()
    {
        //set all list button to challenge except one who play as
        for (int i = 0; i < contentbox.transform.childCount; i++)
        {
            if (!contentbox.transform.GetChild(i).GetComponent<Playermanager>().playAs)
            {
                contentbox.transform.GetChild(i).GetChild(3).gameObject.SetActive(true);
                contentbox.transform.GetChild(i).GetChild(4).gameObject.SetActive(false);
            }
            else
            {
                contentbox.transform.GetChild(i).GetChild(3).gameObject.SetActive(false);
                contentbox.transform.GetChild(i).GetChild(4).gameObject.SetActive(true);
            }
        }
    }

    //update coin
    public void UpdatePlayerCoin()
    {
        //Player Coin Updation
        int _playerIndex = ServerManager.Instance.playerData.players.FindIndex(data => data.id == player);
        contentbox.GetChild(_playerIndex).GetComponent<Playermanager>().pot = playerPot;
        contentbox.GetChild(_playerIndex).GetComponent<Playermanager>().SetupData();

        //Opponent Coin Updation
        int _opponentIndex = ServerManager.Instance.playerData.players.FindIndex(data => data.id == opponent);
        contentbox.GetChild(_opponentIndex).GetComponent<Playermanager>().pot = oppoPot;
        contentbox.GetChild(_opponentIndex).GetComponent<Playermanager>().SetupData();
    }

    //Reset Panel
    public void OnResetPanel()
    {
        ChallengeConfirmScreen.SetActive(false);
        indexScreen.SetActive(true);
        RaceScreen.SetActive(false);
    }

    //Start game data setup
    public void OnRefreshPanel()
    {
        //destroy all child of container
        foreach (Transform child in contentbox.transform)
        {
            GameObject.Destroy(child.gameObject);
        }

        List<Player> playersData = ServerManager.Instance.playerData.players;
        Metadata playerMetadata = ServerManager.Instance.playerData.metadata;

        //instantiate list data prefab with initial generated data
        for (int i = 0; i < playersData.Count; i++)
        {
            GameObject chara = Instantiate(playerDataPrefab, Vector3.zero, Quaternion.identity, contentbox.transform);
            chara.GetComponent<Playermanager>().index = playersData[i].id;
            chara.GetComponent<Playermanager>().DogImage = ServerManager.Instance.imageDictionary[playersData[i].image];
            chara.GetComponent<Playermanager>().power = (float)(playersData[i].flowRate * 60 * 60);//(float)Random.Range(0f, 100f);
            chara.GetComponent<Playermanager>().pot = playersData[i].balance;//Random.Range(700, 1000);
            chara.GetComponent<Playermanager>().strenghvalue = (float)playerMetadata.playerStrength * 100; //(int)(System.Math.Round(Random.Range(0.01f, 1.00f), 2) * 100);
            bool isPLayAs = playerMetadata.playerId == playersData[i].id || playersData[i].id == "";
            chara.GetComponent<Playermanager>().playAs = isPLayAs;
            if (isPLayAs) chara.GetComponent<Playermanager>().playasButton();
            chara.transform.GetChild(3).gameObject.SetActive(!isPLayAs);
            chara.transform.GetChild(4).gameObject.SetActive(isPLayAs);
        }
    }
}