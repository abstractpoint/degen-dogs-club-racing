using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.SceneManagement;

[Serializable]
public class Metadata
{
    public string arenaStateId;
    public string playerId;
    public double playerStrength;
}

[Serializable]
public class Player
{
    public string id;
    public double flowRate;
    public int balance;
}

[Serializable]
public class PlayerData
{
    public Metadata metadata;
    public List<Player> players;
}

[Serializable]
public class Payload
{
    public float player;
    public float opponent;
}

[Serializable]
public class Challenge
{
    public string result;
    public string message;
    public Payload payload;
}

[Serializable]
public class ChallengeData
{
    public Challenge challenge;
    public PlayerData arena;
}

[Serializable]
public class PostData
{
    public string opponentId;
    public string arenaStateId;

    public PostData() { }

    public PostData(string _opponentId, string _arenaStateId)
    {
        opponentId = _opponentId;
        arenaStateId = _arenaStateId;
    }
}

public class ServerManager : MonoBehaviour
{
    #region Private_Variables
    [SerializeField]
    private string m_BaseGetUrl;
    [SerializeField]
    private string m_BasePostUrl;
    public static ServerManager Instance { get; private set; }

    #endregion

    #region Public_Vars
    public PlayerData playerData; // the data from the response will be stored in this object

    public ChallengeData challengeData; //challange data responce

    public PostData postData; // post data
    #endregion

    #region Unity_Callbacks

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(this.gameObject);
        }
        else if (Instance != this)
        {
            Destroy(this.gameObject);
            return;
        }
    }

    private IEnumerator Start()
    {
        yield return StartCoroutine(LoadArenaData(m_BaseGetUrl));
        LoadNextScene();
    }

    //void Update()
    //{
    //    if (Input.GetKeyDown(KeyCode.X))
    //    {
    //        StartCoroutine(LoadChallengeData(m_BasePostUrl, new PostData("2", "6DC419FB-311F-4F57-9FAA-A7A743519B10")));
    //    }
    //}

    #endregion

    #region Public_Methods

    public void OnLoadArenaData() => StartCoroutine(LoadArenaData(m_BaseGetUrl));

    public void OnLoadChallengeAPI(PostData data) => StartCoroutine(LoadChallengeData(m_BasePostUrl, data));

    #endregion

    #region Coroutines

    IEnumerator LoadArenaData(string uri)
    {
        using (UnityWebRequest webRequest = UnityWebRequest.Get(uri))
        {
            // Request and wait for the desired page.
            yield return webRequest.SendWebRequest();

            string[] pages = uri.Split('/');
            int page = pages.Length - 1;

            switch (webRequest.result)
            {
                case UnityWebRequest.Result.ConnectionError:
                case UnityWebRequest.Result.DataProcessingError:
                    Debug.LogError(pages[page] + ": Error: " + webRequest.error);
                    break;
                case UnityWebRequest.Result.ProtocolError:
                    Debug.LogError(pages[page] + ": HTTP Error: " + webRequest.error);
                    break;
                case UnityWebRequest.Result.Success:
                    Debug.Log(pages[page] + ":\nReceived: " + webRequest.downloadHandler.text);
                    string json = webRequest.downloadHandler.text;
                    playerData = JsonUtility.FromJson<PlayerData>(json);
                    Debug.Log("The player data is: " + json.ToString());
                    if (Main.instance != null) Main.instance.OnRefreshPanel();
                    break;
            }
        }
    }

    IEnumerator LoadChallengeData(string uri, PostData _jsonData)
    {
        var json = JsonUtility.ToJson(_jsonData);
        using (UnityWebRequest webRequest = UnityWebRequest.Put(uri, json))
        {
            // Request and wait for the desired page.
            //webRequest.uploadHandler = new UploadHandlerRaw(jsonBytes);
            webRequest.downloadHandler = new DownloadHandlerBuffer();
            //webRequest.SetRequestHeader("Content-Type", "application/json");
            yield return webRequest.SendWebRequest();

            string[] pages = uri.Split('/');
            int page = pages.Length - 1;

            switch (webRequest.result)
            {
                case UnityWebRequest.Result.ConnectionError:
                case UnityWebRequest.Result.DataProcessingError:
                    Debug.LogError(pages[page] + ": Error: " + webRequest.error);
                    break;
                case UnityWebRequest.Result.ProtocolError:
                    Debug.LogError(pages[page] + ": HTTP Error: " + webRequest.error);
                    break;
                case UnityWebRequest.Result.Success:
                    string jsonresponce = webRequest.downloadHandler.text;
                    challengeData = JsonUtility.FromJson<ChallengeData>(jsonresponce);
                    playerData = challengeData.arena;
                    Debug.Log("The player data is: " + jsonresponce.ToString());
                    ChallengeConfirmScreen.challenge.OnCompleteCallAPI();
                    break;
            }
        }
    }

    #endregion

    #region Private_Methods
    private void LoadNextScene()
    {
        int currentScene = SceneManager.GetActiveScene().buildIndex;
        SceneManager.LoadScene(++currentScene);
    }
    #endregion
}
