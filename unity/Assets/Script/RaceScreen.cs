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
    RectTransform playerTransform;
    RectTransform opponentTransform;
    //Race speeds
    public float playerspeed1, oppspeed1;
    public float playerspeed2, oppspeed2;
    public float playerspeed3, oppspeed3;

    public bool racebegain = false;
    public float raceTime;

    // Update is called once per frame
    void Update()
    {
        //if race start
        if (racebegain)
        {
            if (playerslider.value < 1000) {
                float timeModulo = Time.time % 0.3f;

                if (timeModulo < 0.1f)
                {
                    playerTransform.localPosition = new Vector3(playerTransform.localPosition.x, playerTransform.localPosition.y + 1.6f, playerTransform.localPosition.z);

                }
                else if (timeModulo < 0.2f)
                {
                    playerTransform.localPosition = new Vector3(playerTransform.localPosition.x, playerTransform.localPosition.y - 0.8f, playerTransform.localPosition.z);

                }
                else
                {
                    playerTransform.localPosition = new Vector3(playerTransform.localPosition.x, playerTransform.localPosition.y - 0.8f, playerTransform.localPosition.z);

                }
            }

            if (opponentslider.value < 1000) {
                float timeModulo = (Time.time + 0.5f) % 0.3f;

                if (timeModulo < 0.1f)
                {
                    opponentTransform.localPosition = new Vector3(opponentTransform.localPosition.x, opponentTransform.localPosition.y + 1.6f, opponentTransform.localPosition.z);
                }
                else if (timeModulo < 0.2f)
                {

                    opponentTransform.localPosition = new Vector3(opponentTransform.localPosition.x, opponentTransform.localPosition.y - 0.8f, opponentTransform.localPosition.z);
                }
                else
                {

                    opponentTransform.localPosition = new Vector3(opponentTransform.localPosition.x, opponentTransform.localPosition.y - 0.8f, opponentTransform.localPosition.z);
                }
            }

            if (Mathf.Abs(Time.time - raceTime) >= 6f) {
                playerslider.value += playerspeed3 * Time.deltaTime;
                opponentslider.value += oppspeed3 * Time.deltaTime;
            } else if (Mathf.Abs(Time.time - raceTime) >= 3f) {
                playerslider.value += playerspeed2 * Time.deltaTime;
                opponentslider.value += oppspeed2 * Time.deltaTime;
            } else {
                playerslider.value += playerspeed1 * Time.deltaTime;
                opponentslider.value += oppspeed1 * Time.deltaTime;
            }
        }

    }

    public void RaceSetup()
    {
        //set nft image to the race path (slider)
        playerslider.transform.GetChild(0).GetChild(0).GetComponent<Image>().sprite = Main.instance.playerimage;
        opponentslider.transform.GetChild(0).GetChild(0).GetComponent<Image>().sprite = Main.instance.opponentimage;

        playerTransform = playerslider.transform.GetChild(0).GetChild(0).GetComponent<RectTransform>();
        opponentTransform = opponentslider.transform.GetChild(0).GetChild(0).GetComponent<RectTransform>();

        //set starting point of player and opponent
        playerslider.value = 0f;
        opponentslider.value = 0f;

        WinnerText.SetActive(false);

        float playerstre = ServerManager.Instance.challengeData.challenge.payload.streamStage.player + ServerManager.Instance.challengeData.challenge.payload.traitStage.player + ServerManager.Instance.challengeData.challenge.payload.strengthStage.player;

        float oppostre = ServerManager.Instance.challengeData.challenge.payload.streamStage.opponent + ServerManager.Instance.challengeData.challenge.payload.traitStage.opponent + ServerManager.Instance.challengeData.challenge.payload.strengthStage.opponent;

        string message = ServerManager.Instance.challengeData.challenge.message;

        float speedPerSecond = 1000f / 3; // speed per second

        //if player strength is higher than  opponent strenth
        if (playerstre > oppostre)
        {
            float multiplier = 1f / playerstre;

            playerspeed1 = ServerManager.Instance.challengeData.challenge.payload.streamStage.player * multiplier * speedPerSecond;
            playerspeed2 = ServerManager.Instance.challengeData.challenge.payload.traitStage.player * multiplier * speedPerSecond;
            playerspeed3 = ServerManager.Instance.challengeData.challenge.payload.strengthStage.player * multiplier * speedPerSecond;

            oppspeed1 = ServerManager.Instance.challengeData.challenge.payload.streamStage.opponent * multiplier * speedPerSecond;
            oppspeed2 = ServerManager.Instance.challengeData.challenge.payload.traitStage.opponent * multiplier * speedPerSecond;
            oppspeed3 = ServerManager.Instance.challengeData.challenge.payload.strengthStage.opponent * multiplier * speedPerSecond;

        }
        else
        {
            float multiplier = 1f / oppostre;

            playerspeed1 = ServerManager.Instance.challengeData.challenge.payload.streamStage.player * multiplier * speedPerSecond;
            playerspeed2 = ServerManager.Instance.challengeData.challenge.payload.traitStage.player * multiplier * speedPerSecond;
            playerspeed3 = ServerManager.Instance.challengeData.challenge.payload.strengthStage.player * multiplier * speedPerSecond;

            oppspeed1 = ServerManager.Instance.challengeData.challenge.payload.streamStage.opponent * multiplier * speedPerSecond;
            oppspeed2 = ServerManager.Instance.challengeData.challenge.payload.traitStage.opponent * multiplier * speedPerSecond;
            oppspeed3 = ServerManager.Instance.challengeData.challenge.payload.strengthStage.opponent * multiplier * speedPerSecond;
        }

        //set winner text
        WinnerText.transform.GetComponent<TextMeshProUGUI>().text = message;

        //Start race animation
        racebegain = true;
        raceTime = Time.time;
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