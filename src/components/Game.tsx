import { DateTime } from "luxon";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  getCountryName,
  countryISOMapping,
  getFictionalCountryByName,
  getCountryByName,
  getCountryByCode,
} from "../domain/countries";
import { getCompassDirection } from "../domain/geography";
import { useGuesses } from "../hooks/useGuesses";
import { CountryInput } from "./CountryInput";
import * as geolib from "geolib";
import { Share } from "./Share";
import { Guesses } from "./Guesses";
import { useTranslation } from "react-i18next";
import { SettingsData } from "../hooks/useSettings";
import { useMode } from "../hooks/useMode";
import { useCountry } from "../hooks/useCountry";
import axios from "axios";

function getDayString() {
  return DateTime.now().toFormat("yyyy-MM-dd");
}

const MAX_TRY_COUNT = 10;

interface GameProps {
  settingsData: SettingsData;
}

// List of country codes for the game
const countries = [
  "af", "al", "dz", "as", "ad", "ao", "ai", "aq", "ag", "ar", "am", "aw", "au", "at", "az",
  "bs", "bh", "bd", "bb", "by", "be", "bz", "bj", "bm", "bt", "bo", "ba", "bw", "bv", "br",
  "io", "bn", "bg", "bf", "bi", "kh", "cm", "ca", "cv", "ky", "cf", "td", "cl", "cn", "cx",
  "cc", "co", "km", "cg", "cd", "ck", "cr", "ci", "hr", "cu", "cy", "cz", "dk", "dj", "dm",
  "do", "ec", "eg", "sv", "gq", "er", "ee", "et", "fk", "fo", "fj", "fi", "fr", "gf", "pf",
  "tf", "ga", "gm", "ge", "de", "gh", "gi", "gr", "gl", "gd", "gp", "gu", "gt", "gg", "gn",
  "gw", "gy", "ht", "hm", "hn", "hk", "hu", "is", "in", "id", "ir", "iq", "ie", "im", "il",
  "it", "jm", "jp", "je", "jo", "kz", "ke", "ki", "kp", "kr", "kw", "kg", "la", "lv", "lb",
  "ls", "lr", "ly", "li", "lt", "lu", "mo", "mk", "mg", "mw", "my", "mv", "ml", "mt", "mh",
  "mq", "mr", "mu", "yt", "mx", "fm", "md", "mc", "mn", "me", "ms", "ma", "mz", "mm", "na",
  "nr", "np", "nl", "nc", "nz", "ni", "ne", "ng", "nu", "nf", "mp", "no", "om", "pk", "pw",
  "ps", "pa", "pg", "py", "pe", "ph", "pn", "pl", "pt", "pr", "qa", "re", "ro", "ru", "rw",
  "bl", "sh", "kn", "lc", "mf", "pm", "vc", "ws", "sm", "st", "sa", "sn", "rs", "sc", "sl",
  "sg", "sx", "sk", "si", "sb", "so", "za", "gs", "ss", "es", "lk", "sd", "sr", "sj", "sz",
  "se", "ch", "sy", "tw", "tj", "tz", "th", "tl", "tg", "tk", "to", "tt", "tn", "tr", "tm",
  "tc", "tv", "ug", "ua", "ae", "gb", "us", "um", "uy", "uz", "vu", "va", "ve", "vn", "vg",
  "vi", "wf", "eh", "ye", "zm", "zw"
];

export function Game({ settingsData }: GameProps) {
  const { t, i18n } = useTranslation();
  const dayString = useMemo(getDayString, []);
  const isAprilFools = dayString === "2022-04-01";

  const countryInputRef = useRef<HTMLInputElement>(null);

  const [ipData, setIpData] = useState(null);
  const [won, setWon] = useState(false);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [countryValue, setCountryValue] = useState<string>("");
  const [guesses, addGuess, resetGuesses] = useGuesses(dayString);
  const [hideImageMode, setHideImageMode] = useMode(
    "hideImageMode",
    dayString,
    settingsData.noImageMode
  );
  const [rotationMode, setRotationMode] = useMode(
    "rotationMode",
    dayString,
    settingsData.rotationMode
  );

  
  const [country, setCountry] = useState<any>();


  const gameEnded =
    guesses.length === MAX_TRY_COUNT ||
    guesses[guesses.length - 1]?.distance === 0;

  function getNewCountry() {
    const randomIndex = Math.floor(Math.random() * countries.length);
    const newCountryCode = countries[randomIndex].toUpperCase();
    console.log("new country code: ", newCountryCode);
    var newCountryName = getCountryByCode(newCountryCode);
    console.log("newCountryName: ", newCountryName);
    return newCountryName;
  }

  const startNewGame = useCallback(() => {
    console.log("startNewGameOld called");
    resetGuesses();
    console.log("after resetGuesses length: ", guesses.length);
    guesses.forEach((g) => {
      console.log("G");
      console.log(g);
    });
    
    console.log("before set country: ", country)
    var randomCountry = getNewCountry()
    console.log("while set country: ", randomCountry)
    setCountry(randomCountry);
    console.log("after set country: ", country)
    setWon(false);
    window.location.reload();

  }, [resetGuesses]);


  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!country) return;
      const getIpData = async () => {
        const res = await axios.get("https://geolocation-db.com/json/");
        setIpData(res.data);
      };
      const guessedCountry = isAprilFools
        ? getFictionalCountryByName(currentGuess)
        : getCountryByName(currentGuess);

      if (guessedCountry == null) {
        toast.error(t("unknownCountry"));
        return;
      }

      const newGuess = {
        name: currentGuess,
        distance: geolib.getDistance(guessedCountry, country),
        direction: getCompassDirection(guessedCountry, country),
        country: guessedCountry,
      };

      addGuess(newGuess);
      setCurrentGuess("");
      setCountryValue("");

      if (newGuess.distance === 0) {
        setWon(true);
        getIpData();
      }
    },
    [addGuess, country, currentGuess, t, isAprilFools]
  );

  useEffect(() => {
    console.log("Initialization of country");
    if(country == undefined){
      console.log("Country not defined");
      setCountry(getNewCountry());
    }
  })

  useEffect(() => {
    const getIpData = async () => {
      const res = await axios.get("https://geolocation-db.com/json/");
      setIpData(res.data);
    };
    if (
      guesses.length === MAX_TRY_COUNT &&
      guesses[guesses.length - 1].distance > 0
    ) {
      const countryName = country
        ? getCountryName(i18n.resolvedLanguage, country)
        : "";
      if (countryName) {
        toast.info(countryName.toUpperCase(), {
          autoClose: false,
          delay: 2000,
        });
      }
      getIpData();
    }
  }, [country, guesses, i18n.resolvedLanguage]);

  useEffect(() => {
    if (ipData) {
      axios
        .post("/tradle/score", {
          date: new Date(),
          guesses,
          ip: ipData,
          answer: country,
          won,
        })
        .catch(function (error) {
          if (error.response) {
            // Request made and server responded
            console.log(
              `⚠️ ${error.response.status}: Unable to post tradle score.`
            );
          } else if (error.request) {
            // The request was made but no response was received
            console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            console.log("Error", error.message);
          }
        });
    }
  }, [guesses, ipData, won, country]);

  useEffect(() => {
    //if (gameEnded) {
    //  setTimeout(startNewGame, 2000);
    //}
  }, [gameEnded, startNewGame]);

  let iframeSrc = "https://oec.world/en/tradle/aprilfools.html";
  let oecLink = "https://oec.world/";
  const country3LetterCode = country?.code
    ? countryISOMapping[country.code].toLowerCase()
    : "";
  if (!isAprilFools) {
    console.log("Showing regular tradle: ");
    console.log(country?.oecCode);
    const oecCode = country?.oecCode
      ? country?.oecCode?.toLowerCase()
      : country3LetterCode;
    iframeSrc = `https://oec.world/en/visualize/embed/tree_map/hs92/export/${oecCode}/all/show/2022/?controls=false&title=false&click=false`;
    oecLink = `https://oec.world/en/profile/country/${country3LetterCode}`;
  }

  return (
    <div className="flex-grow flex flex-col mx-2 relative">
      {hideImageMode && !gameEnded && (
        <button
          className="border-2 uppercase my-2 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
          type="button"
          onClick={() => setHideImageMode(false)}
        >
          {t("showCountry")}
        </button>
      )}
      <h2 className="font-bold text-center">
        Guess which country exports these products!
      </h2>
      <div
        style={{
          position: "relative",
          paddingBottom: "70%",
          paddingTop: "25px",
          height: 0,
        }}
      >
        {country3LetterCode ? (
          <iframe
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            title="Country to guess"
            width="390"
            height="315"
            src={iframeSrc}
            frameBorder="0"
          />
        ) : null}
      </div>
      {rotationMode && !hideImageMode && !gameEnded && (
        <button
          className="border-2 uppercase mb-2 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
          type="button"
          onClick={() => setRotationMode(false)}
        >
          {t("cancelRotation")}
        </button>
      )}
      <Guesses
        rowCount={MAX_TRY_COUNT}
        guesses={guesses}
        settingsData={settingsData}
        countryInputRef={countryInputRef}
        isAprilFools={isAprilFools}
      />
      <div className="my-2">
        {gameEnded ? (
          <>
            <Share
              guesses={guesses}
              dayString={dayString}
              settingsData={settingsData}
              hideImageMode={hideImageMode}
              rotationMode={rotationMode}
              won={guesses[guesses.length - 1]?.distance === 0}
              isAprilFools={isAprilFools}
            />
            <a
              className="underline w-full text-center block mt-4 flex justify-center"
              href={oecLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 2 0 00-2-2v10a2 2 2 0 00-2-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              {t("showOnGoogleMaps")}
            </a>
            {isAprilFools ? (
              <div className="w-full text-center block mt-4 flex flex-col justify-center text-2xl font-bold">
                <div>🐶 🚲 🌪 🏚</div>
                <div>Happy April Fools!</div>
                <div>👠 🤖 🦁 🎍</div>
              </div>
            ) : null}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="">
              <CountryInput
                countryValue={countryValue}
                setCountryValue={setCountryValue}
                setCurrentGuess={setCurrentGuess}
                isAprilFools={isAprilFools}
              />
              <div className="text-left">
                <button className="my-2 inline-block justify-end bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded items-center">
                  {isAprilFools ? "🪄" : "🌍"} <span>Guess</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
      <button
        className="border-2 uppercase my-2 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
        type="button"
        onClick={startNewGame}
      >
        {t("resetGame")}
      </button>
    </div>
  );
}
