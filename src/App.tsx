import CharacterSelect from './components/CharacterSelect'
import ClassSelect from './components/ClassSelect'
import GameScreen from './components/GameScreen'
import { useGameStore } from './store/gameStore'

export default function App() {
  const hasCharacter = useGameStore((s) => s.character !== null)
  const hasRoster = useGameStore((s) => s.roster.length > 0)
  const creatingNew = useGameStore((s) => s.creatingNew)

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-3">
      {hasCharacter ? (
        <GameScreen />
      ) : creatingNew || !hasRoster ? (
        <ClassSelect />
      ) : (
        <CharacterSelect />
      )}
    </div>
  )
}
