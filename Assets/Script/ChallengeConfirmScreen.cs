using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class ChallengeConfirmScreen : MonoBehaviour
{
    public static ChallengeConfirmScreen challenge;
    public Image playerphoto, opponentphoto;
    public Slider playerrandomvalue;
    public TextMeshProUGUI playerstrength;

    // Start is called before the first frame update
    void Start()
    {
        //instance
        challenge = this;
        //Set player and Opponent data on challenge Screen
        SetChallengeData();

    }

    // Update is called once per frame
    void Update()
    {
        
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
        playerstrength.text = Main.instance.playerstre.ToString()+"%";
    }

    public void OnstartRace()
    {
        //Active Race Screen
        //Main.instance.ChallengeConfirmScreen.SetActive(false);
        //Main.instance.RaceScreen.SetActive(true);
        //To set the race screen
        //Main.instance.RaceScreen.GetComponent<RaceScreen>().RaceSetup();
    }

    public void OnCancel()
    {
        //go back to the challenge screen
        Main.instance.ChallengeConfirmScreen.SetActive(false);
        Main.instance.indexScreen.SetActive(true);

    }
}
