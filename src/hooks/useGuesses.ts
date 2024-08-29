import { useCallback, useState } from "react";
import { Guess, loadAllGuesses, saveGuesses } from "../domain/guess";

export function useGuesses(
  dayString: string
): [Guess[], (guess: Guess) => void, () => void] {
  const [guesses, setGuesses] = useState<Guess[]>(
    loadAllGuesses()[dayString] ?? []
  );

  const addGuess = useCallback(
    (newGuess: Guess) => {
      const newGuesses = [...guesses, newGuess];
      setGuesses(newGuesses);
      saveGuesses(dayString, newGuesses);
    },
    [dayString, guesses]
  );

  const resetGuesses = useCallback(() => {
    setGuesses([]);
    saveGuesses(dayString, []);
  }, [dayString]);

  return [guesses, addGuess, resetGuesses];
}
