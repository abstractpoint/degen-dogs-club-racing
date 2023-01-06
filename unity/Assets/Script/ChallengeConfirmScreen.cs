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

    public Button startRaceButton;
    public TextMeshProUGUI startRaceButtonText;
    public TextMeshProUGUI resultText;

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
        //set player pic
        playerphoto.sprite = Main.instance.playerimage;
        //set opponent pic
        opponentphoto.sprite = Main.instance.opponentimage;
        //set player random value
        playerrandomvalue.value = Main.instance.playerstre;
        //set player strength 
        playerstrength.text = Main.instance.playerstre.ToString() + "%";

        startRaceButtonText.SetText("START RACE");
        resultText.gameObject.SetActive(false);
        startRaceButton.gameObject.SetActive(true);
    }

    public void OnstartRace()
    {
        resultText.gameObject.SetActive(false);
        if (ServerManager.Instance.challengeData.challenge.result == "ARENA_CHANGED" || startRaceButtonText.text == "START RACE")
        {
            startRaceButton.interactable = false;
            startRaceButtonText.SetText("Starting challenge...");
            ServerManager.Instance.OnLoadChallengeAPI(ServerManager.Instance.postData);
        }
        else
        {
            //Active Race Screen
            Main.instance.ChallengeConfirmScreen.SetActive(false);
            Main.instance.RaceScreen.SetActive(true);
            //To set the race screen
            Main.instance.RaceScreen.GetComponent<RaceScreen>().RaceSetup();
        }
    }

    public void OnCancel()
    {
        //go back to the challenge screen
        //ServerManager.Instance.OnLoadArenaData();

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
        if (ServerManager.Instance.challengeData.arena.players.Where(data => int.Parse(data.id) == Main.instance.opponent).Count() == 0)
        {
            resultText.SetText("Opponent inactive!!!");
            resultText.gameObject.SetActive(true);
            startRaceButton.gameObject.SetActive(false);
        }
        else if (ServerManager.Instance.challengeData.challenge.result == "ARENA_CHANGED")
        {
            resultText.SetText(ServerManager.Instance.challengeData.challenge.message);
            resultText.gameObject.SetActive(true);
            startRaceButtonText.SetText("Continue anyway...");
        }
        else
        {
            Debug.Log("Start the game...");
        }
    }
}
