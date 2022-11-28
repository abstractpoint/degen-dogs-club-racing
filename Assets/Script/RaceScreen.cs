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

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        //if race start
        if(racebegain)
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
        //if player strength is higher than  opponent strenth
        if(Main.instance.playerstre > Main.instance.oppostre)
        {
            //set player speed to normal winning speed
            playerspeed = 1000f/9;
            //set opponent speed w.r.t to ratio of opponent and player strength
            oppspeed = (float)(((float)Main.instance.oppostre/(float)Main.instance.playerstre)*playerspeed);
            //Debug.Log("opp "+(Main.instance.oppostre/Main.instance.playerstre));

            #region Logic for win and lose
            //To reproduce, start the game, select first player as “Play As”, 
            //select to play against second player when timer has counted down 
            //to 4:50 (10 seconds out of 300). If player wins he should get 46.6% 
            //of the opponents pot, because 50% - (10/300=3.33%) = 46.6%. If player 
            //looses he should lose 50% of his pot, and opponent gets that whole amount.
            #endregion
            
          
                //  opponent pot amount devided by 2 (50%)
                int amount_to_give =Main.instance.oppoPot / 2;
                float x = ((Main.instance.timeRemaining)/300);
                int price = (int)(amount_to_give*x);

                // clamp number to 4x playerPot
                price = Mathf.Clamp(price, 0, Main.instance.playerPot * 4);

                //set winner text
                WinnerText.transform.GetComponent<TextMeshProUGUI>().text = "Player wins & Opponent losses "+ price + " Coins.";

                Main.instance.oppoPot -= price;
                //  add opponent's 50% amount in player's pot
                Main.instance.playerPot += price;
                //Debug.Log("pot1:"+Main.instance.playerPot);
                
           
        } else {
            //set opponent speed to normal winning speed
            oppspeed = 1000f/9;
            //set player speed w.r.t to ratio of player and opponent strength
            playerspeed = (float)(((float)Main.instance.playerstre/(float)Main.instance.oppostre)*oppspeed);
            //set winner text
            WinnerText.transform.GetComponent<TextMeshProUGUI>().text = "Opponent wins & Player losses "+ (Main.instance.playerPot/2)+ " Coins.";
            //Devide player pot amount by 2
            Main.instance.playerPot /= 2;
            //and add that amount in opponent's pot
            Main.instance.oppoPot += (Main.instance.playerPot);
            
            // Debug.Log("pot3:"+Main.instance.oppoPot);
        }
        //update Coins (Pot value) in list
        Main.instance.UpdatePlayerCoin();
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