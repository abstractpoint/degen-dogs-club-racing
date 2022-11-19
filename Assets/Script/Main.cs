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
    //time boolean
    private bool timerIsRunning = false;
    
    //index
    public int player, opponent;
    //list data prefab
    public GameObject playerDataPrefab;

    //nft image list
    public List<Sprite> dogimagelist;

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
        timer.text = string.Format("{0:0}m{1:00}s", minutes, seconds);
    }

    //Reset time
    void ResetTimer()
    {
        //time to 5 min & on index screen
        timeRemaining = 300;
        timerIsRunning = true;
        indexScreen.SetActive(true);
        ChallengeConfirmScreen.SetActive(false);
    }

    //on click challenge
    public void OnSetChallenge()
    {
        //set all list button to challenge except one who play as
        for (int i = 0; i < contentbox.transform.childCount; i++)
        {
            if(!contentbox.transform.GetChild(i).GetComponent<Playermanager>().playAs)
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
        contentbox.GetChild(player).GetComponent<Playermanager>().pot = playerPot;
        contentbox.GetChild(player).GetComponent<Playermanager>().SetupData();

        //Opponent Coin Updation
        contentbox.GetChild(opponent).GetComponent<Playermanager>().pot = oppoPot;
        contentbox.GetChild(opponent).GetComponent<Playermanager>().SetupData();
    }

    //Reset Panel
    public void OnResetPanel()
    {
        //on index screen to challenge
        //change strength of player and opponent
        contentbox.GetChild(player).GetComponent<Playermanager>().strenghvalue = (int)(System.Math.Round(Random.Range(0.01f, 1.00f),2)*100);
        playerstre = (int)contentbox.GetChild(player).GetComponent<Playermanager>().strenghvalue;
        Debug.Log("New player strength: "+playerstre);
        contentbox.GetChild(opponent).GetComponent<Playermanager>().strenghvalue = (int)(System.Math.Round(Random.Range(0.01f, 1.00f),2)*100);
        oppostre = (int)contentbox.GetChild(opponent).GetComponent<Playermanager>().strenghvalue;
        Debug.Log("New opponent strength: "+oppostre);
        
        Main.instance.OnSetChallenge();
        ChallengeConfirmScreen.SetActive(false);
        indexScreen.SetActive(true);
        RaceScreen.SetActive(false);
    }

    //Start game data setup
    public void OnRefreshPanel()
    {
        ChallengeConfirmScreen.SetActive(false);
        indexScreen.SetActive(true);
        RaceScreen.SetActive(false);

        //destroy all child of container
        foreach (Transform child in contentbox.transform) 
        {
            GameObject.Destroy(child.gameObject);
        }

        //instantiate list data prefab with initial generated data
        for (int i = 0; i < 30; i++)
        {
            GameObject chara = Instantiate(playerDataPrefab, Vector3.zero, Quaternion.identity, contentbox.transform);
            chara.GetComponent<Playermanager>().index = i;
            chara.GetComponent<Playermanager>().DogImage = dogimagelist[Random.Range(0, dogimagelist.Count-1)];
            chara.GetComponent<Playermanager>().power = (float)Random.Range(0f, 100f);
            chara.GetComponent<Playermanager>().pot = Random.Range(700, 1000);
            chara.GetComponent<Playermanager>().strenghvalue = (int)(System.Math.Round(Random.Range(0.01f, 1.00f),2)*100);
            Debug.Log(i+" Strength:"+ chara.GetComponent<Playermanager>().strenghvalue);
            chara.GetComponent<Playermanager>().playAs = false;
        }
    }
}