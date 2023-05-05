using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Linq;

public class ChallengeConfirmScreen : MonoBehaviour
{
    public static ChallengeConfirmScreen challenge;
    public Image playerphoto, opponentphoto;
    public Slider playerrandomvalue;
    public TextMeshProUGUI playerstrength;
    public TextMeshProUGUI playerNumber;
    public TextMeshProUGUI opponentNumber;
    public Button startRaceButton;
    public TextMeshProUGUI startRaceButtonText;
    public TextMeshProUGUI resultText;
    public TextMeshProUGUI playerProbText;
    public TextMeshProUGUI opponentProbText;
    public TextMeshProUGUI[] traitsTextsPlayer;
    public TextMeshProUGUI[] traitsTextsOpponent;
    public string arenaStateIdWhenChallenge;

    public Image[] playerTicks;
    public Image[] opponentTicks;
    


    [SerializeField] private Sprite tick;
    [SerializeField] private Sprite cross;
    [SerializeField] private Sprite dash;

    // Start is called before the first frame update
    void Start()
    {
        //instance
        challenge = this;
        //Set player and Opponent data on challenge Screen
        SetChallengeData();

    }

    public void SetChallengeData()
    {
        arenaStateIdWhenChallenge = ServerManager.Instance.playerData.metadata.arenaStateId;
        //set player pic
        playerphoto.sprite = Main.instance.playerimage;
        opponentNumber.text = "#" + Main.instance.oppoNftId.PadLeft(4, '0');
        playerNumber.text = "#" + Main.instance.playerNftId.PadLeft(4, '0');
        //set opponent pic
        opponentphoto.sprite = Main.instance.opponentimage;
        //set player random value
        playerrandomvalue.value = Main.instance.playerstre;
        //set player strength 
        playerstrength.text = Main.instance.playerstre.ToString() + "%";

        for (int i = 0; i < traitsTextsOpponent.Length; i++)
        {
         
           traitsTextsOpponent[i].SetText(Main.instance.opponentTraitValues[i]);
        }
        
        for (int i = 0; i < traitsTextsPlayer.Length; i++)
        {
         
            traitsTextsPlayer[i].SetText(Main.instance.playerTraitValues[i]);
        }

        for (int i = 0; i < playerTicks.Length; i++)
        {
            if (Main.instance.traitsOutcome[i] == "equal")
            {
                playerTicks[i].sprite = dash;
                opponentTicks[i].sprite = dash;
            }
            else if (Main.instance.traitsOutcome[i] == "advantage")
            {
                playerTicks[i].sprite = cross;
                opponentTicks[i].sprite = tick;
            }
            else if (Main.instance.traitsOutcome[i] == "disadvantage")
            {
                playerTicks[i].sprite = tick;
                opponentTicks[i].sprite = cross;
            }
        }

        int playerProb = (int) (Main.instance.playerTraitScore * 100);
        int opponentProb = (int) (Main.instance.opponentTraitScore * 100);
        playerProbText.SetText(playerProb + "%");
        opponentProbText.SetText(opponentProb + "%");
       
        startRaceButtonText.SetText("START RACE");
        resultText.gameObject.SetActive(false);
        startRaceButton.gameObject.SetActive(true);
    }

    public void OnstartRace()
    {
            resultText.gameObject.SetActive(false);
            startRaceButton.interactable = false;
            startRaceButtonText.SetText("Starting challenge...");
            ServerManager.Instance.OnLoadChallengeAPI(
                new PostData(
                    Main.instance.opponent.ToString(),
                    arenaStateIdWhenChallenge
                )
            );
    }

    public void OnCancel()
    {
        Main.instance.ChallengeConfirmScreen.SetActive(false);
        Main.instance.indexScreen.SetActive(true);
    }

    void OnRefreshData()
    {
        playerrandomvalue.value = Main.instance.playerstre = (int)(ServerManager.Instance.playerData.metadata.playerStrength * 100);
        playerstrength.text = Main.instance.playerstre.ToString() + "%";
        Main.instance.OnRefreshPanel();
    }

    public void OnCompleteCallAPI()
    {
        Main.instance.oppostre = (int)(ServerManager.Instance.challengeData.arena.metadata.playerStrength * 100);
        startRaceButton.interactable = true;
        OnRefreshData();

        if (ServerManager.Instance.challengeData.challenge.result == "ARENA_CHANGED")
        {
            if (ServerManager.Instance.challengeData.arena.players.Where(data => data.id == Main.instance.opponent).Count() == 0)
            {
                resultText.SetText("Opponent inactive!!!");
                resultText.gameObject.SetActive(true);
                startRaceButton.gameObject.SetActive(false);
            } else {
                resultText.SetText(ServerManager.Instance.challengeData.challenge.message);
                resultText.gameObject.SetActive(true);
                startRaceButtonText.SetText("Continue anyway...");
            }
        }
        else
        {
            Debug.Log("Start the race animation ...");
            Main.instance.ChallengeConfirmScreen.SetActive(false);
            Main.instance.RaceScreen.SetActive(true);
            //To set the race screen
            Main.instance.RaceScreen.GetComponent<RaceScreen>().RaceSetup();
        }
    }
}
