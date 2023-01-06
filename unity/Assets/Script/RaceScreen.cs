using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class RaceScreen : MonoBehaviour
{
    //slider
    public Slider playerslider, opponentslider;

    //winner text
    public GameObject WinnerText;

    //Race speed
    public float playerspeed, oppspeed;

    public bool racebegain = false;

    // Update is called once per frame
    void Update()
    {
        //if race start
        if (racebegain)
        {
            //update player and opponent slider w.r.t time
            playerslider.value += playerspeed * Time.deltaTime;
            opponentslider.value += oppspeed * Time.deltaTime;
        }

    }

    public void RaceSetup()
    {
        //set nft image to the race path (slider)
        playerslider.transform.GetChild(0).GetChild(0).GetComponent<Image>().sprite = Main.instance.playerimage;
        opponentslider.transform.GetChild(0).GetChild(0).GetComponent<Image>().sprite = Main.instance.opponentimage;

        //set starting point of player and opponent
        playerslider.value = 0f;
        opponentslider.value = 0f;

        WinnerText.SetActive(false);
        float playerstre = ServerManager.Instance.challengeData.challenge.payload.player;
        float oppostre = ServerManager.Instance.challengeData.challenge.payload.opponent;
        string message = ServerManager.Instance.challengeData.challenge.message;
        //if player strength is higher than  opponent strenth
        if (playerstre > oppostre)
        {
            //set player speed to normal winning speed
            playerspeed = 1000f / 9;
            //set opponent speed w.r.t to ratio of opponent and player strength
            oppspeed = (float)(((float)oppostre / (float)playerstre) * playerspeed);
            //Debug.Log("opp "+(Main.instance.oppostre/Main.instance.playerstre));

            //set winner text
            WinnerText.transform.GetComponent<TextMeshProUGUI>().text = message;
        }
        else
        {
            //set opponent speed to normal winning speed
            oppspeed = 1000f / 9;
            //set player speed w.r.t to ratio of player and opponent strength
            playerspeed = (float)(((float)playerstre / (float)oppostre) * oppspeed);
            //set winner text
            WinnerText.transform.GetComponent<TextMeshProUGUI>().text = message;

            // Debug.Log("pot3:"+Main.instance.oppoPot);
        }
        //Start race
        racebegain = true;
        StartCoroutine("startrace");
    }

    public IEnumerator startrace()
    {
        //wait for 9 seconds to complete race animation
        yield return new WaitForSecondsRealtime(9f);
        //display winning text after 9 sec
        WinnerText.SetActive(true);
        StartCoroutine("OnEndRace");

    }

    public IEnumerator OnEndRace()
    {
        //on end after 4 sec race end 
        yield return new WaitForSecondsRealtime(4f);
        racebegain = false;
        //go back to challenge screen 
        Main.instance.OnResetPanel();
    }
}