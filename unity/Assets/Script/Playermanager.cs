using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class Playermanager : MonoBehaviour
{
    public string index;
    public Sprite DogImage;
    public float power;
    public int pot;
    public float strenghvalue;
    public bool playAs;

    // Start is called before the first frame update
    void Start()
    {
        //Set prefab data
        SetupData();
    }

    public void SetupData()
    {
        //nft image
        transform.GetChild(0).GetComponent<Image>().sprite = DogImage;
        //power random 
        transform.GetChild(1).GetComponent<TextMeshProUGUI>().text = power.ToString() + "p/h";
        //pot (Coins)
        transform.GetChild(2).GetComponent<TextMeshProUGUI>().text = pot.ToString();
        //off challenge button
        //transform.GetChild(3).gameObject.SetActive(false);
        transform.GetChild(3).gameObject.GetComponent<Button>().onClick.AddListener(challengeButton);
        //on play as button
        //transform.GetChild(4).gameObject.SetActive(true);
        // TODO: Functionality still needs some work
        transform.GetChild(4).gameObject.GetComponent<Button>().onClick.AddListener(playasButton);
    }

    public void playasButton()
    {
        //Set player values to main script & off play as button
        playAs = true;
        transform.GetChild(4).GetComponent<Button>().interactable = false;
        //Main.instance.OnSetChallenge();
        Main.instance.player = index;
        Main.instance.playerimage = DogImage;
        Main.instance.playerstre = (int)strenghvalue;
        Main.instance.playerPot = pot;
    }

    public void challengeButton()
    {
        //Set opponent values to main script & on challenge screen
        Main.instance.opponent = index;
        Main.instance.opponentimage = DogImage;
        Main.instance.oppostre = (int)strenghvalue;
        Main.instance.indexScreen.SetActive(false);
        Main.instance.ChallengeConfirmScreen.SetActive(true);

        Main.instance.ChallengeConfirmScreen.GetComponent<ChallengeConfirmScreen>().SetChallengeData();
        Main.instance.oppoPot = pot;
    }

}
