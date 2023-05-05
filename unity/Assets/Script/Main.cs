using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Rendering;
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
    private float timeModulo;

    //index
    public string player, opponent;
    //list data prefab
    public GameObject playerDataPrefab;

    //nft images
    public Sprite playerimage, opponentimage;

    //strength
    public int playerstre, oppostre;

    //token ids
    public string playerNftId, oppoNftId;

    //pot (Coins)
    public int playerPot, oppoPot;

    //
    public float opponentTraitScore;
    public float playerTraitScore;
    public string[] opponentTraitValues;
    public string[] traitsOutcome = new string[7];
    public string[] playerTraitValues;
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
        QualitySettings.vSyncCount = 0;
        Application.targetFrameRate = 30;
        // adaptive rendering at 10 frames per second on start
        OnDemandRendering.renderFrameInterval = 3;
    }

    // Update is called once per frame
    void Update()
    {

        {
            if (Input.GetMouseButton(0) || (Input.touchCount > 0))
            {
                // If the mouse button or touch detected render at 30 FPS (every frame).
                OnDemandRendering.renderFrameInterval = 1;
            }
            else
            {
                // If there is no mouse and no touch input then we can go back to 10 FPS (every 3 frames).
                OnDemandRendering.renderFrameInterval = 3;
            }
        }
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

        float newTimeModulo = Time.time % 5f;
        if (newTimeModulo < timeModulo) {
            Debug.Log("Load arena again");
            ServerManager.Instance.OnLoadArenaData();
        }
        timeModulo = newTimeModulo;
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
          // Instantiate the playerDataPrefab and get a reference to its Playermanager component
          GameObject chara = Instantiate(playerDataPrefab, Vector3.zero, Quaternion.identity, contentbox.transform);
          Playermanager playerManager = chara.GetComponent<Playermanager>();
      
          // Set the properties of the Playermanager component based on the player data
          playerManager.index = playersData[i].id;
          playerManager.DogImage = ServerManager.Instance.imageDictionary[playersData[i].image];
          playerManager.nftId = playersData[i].image; // a number of nft token used for retrieving image and for display
          playerManager.power = (float)(playersData[i].flowRate * 60 * 60);
          playerManager.pot = playersData[i].balance;
          playerManager.strenghvalue = (float)playerMetadata.playerStrength * 100;
          // Setting traits 
          playerManager.opponentTraitScore = playersData[i].traitsScore.opponent;
          playerManager.playerTraitScore = playersData[i].traitsScore.player;
          // Loop through the player's traits and assign the trait outcomes and opponent trait values
          for (int j = 0; j < playerManager.traits.Length; j++)
          {
              string traitName = playerManager.traits[j];
              Trait trait = playersData[i].traits.Find(t => t.name == traitName);
              if (trait != null)
              {
         
                  // Assign trait outcome
                  playerManager.traitsOutcome[j] = trait.outcome;

                  // Assign opponent trait value
                  playerManager.opponentTraitValues[j] = trait.value;
              }
              else
              {
                  Debug.Log("Null " + traitName);
              }
           
          }
         
          bool isPLayAs = playerMetadata.playerId == playersData[i].id || playerMetadata.playerId == "";
          playerManager.playAs = isPLayAs;
          if (isPLayAs) playerManager.playasButton();
          playerManager.transform.GetChild(3).gameObject.SetActive(!isPLayAs);
          playerManager.transform.GetChild(4).gameObject.SetActive(isPLayAs);
      
            
        
 
          
      }

    }
}