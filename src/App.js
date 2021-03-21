import React, { useCallback, useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import Field from './components/Field';
import Button from './components/Button';
import ManipulationPanel from './components/ManipulationPanel';
import { initFields, getFoodPosition } from './utils';

const initialPosition = {x : 17, y : 17}
const initialValues = initFields(35, initialPosition)
const defaultInterval = 100

const GameStatus = Object.freeze({
  init: 'init',
  playing: 'playing',
  suspended: 'suspended',
  gameover: 'gameover'
})

const Direction = Object.freeze({
  up: 'up',
  right: 'right',
  left: 'left',
  down: 'down'
})

const OppositeDirection = Object.freeze({
  up: 'down',
  right: 'left',
  left: 'right',
  down: 'up'
})

const Delta = Object.freeze({
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
});

const DirectionKeyCodeMap = Object.freeze({
  37: Direction.left,
  38: Direction.up,
  39: Direction.right,
  40: Direction.down,
})

let timer = undefined

const unsubscribe = () => {
  if(!timer) {
    return
  }
  clearInterval(timer)
}

const isCollision = (fieldSize, position) => {
  if (position.y < 0 || position.x < 0) {
    return true
  }

  if (position.y > fieldSize - 1 || position.x > fieldSize - 1) {
    return true
  }

  return false
}

const isEatingMyself = (fields, position) => {
  return fields[position.y][position.x] === 'snake'
}

function App() {
  const [fields, setFields] = useState(initialValues)
  const [body, setBody] = useState([])
  const [status, setStatus] = useState(GameStatus.init)
  const [direction, setDirection] = useState(Direction.up)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setBody([initialPosition])
    //ゲーム中の時間を管理する
    timer = setInterval(() => {
      setTick(tick => tick + 1)
    }, defaultInterval)
    return unsubscribe /* return部分はコンポーネントが削除されるタイミングで実行される */
  },[])

  //初回レンタリング時とtick(依存変数の配列)が変更されるときにレンタリングされる際に実行される
  useEffect(() => {
    if(!body || status !== GameStatus.playing) {
      return
    }
    
    const canContinue = handleMoving()
    if(!canContinue) {
      setStatus(GameStatus.gameover)
    }
  },[tick])

  const onStart = () => setStatus(GameStatus.playing)

  const onRestart = () => {
    timer = setInterval(() => {
      setTick(tick => tick + 1)
    }, defaultInterval)

    setStatus(GameStatus.init)
    setBody([initialPosition])
    setDirection(Direction.up)
    setFields(initFields(35, initialPosition))
  }

  const handleMoving = () => {
    const { x, y } = body[0]
    const delta = Delta[direction]
    const newPosition = {
      x: x + delta.x,
      y: y + delta.y
    }

    if(isCollision(fields.length, newPosition) || isEatingMyself(fields, newPosition)) {
      unsubscribe()
      return false
    }

    const newBody = [...body] /* useState以外での更新をするのはタブーなのでスプレッド構文でコピー */
    if(fields[newPosition.y][newPosition.x] !== 'food') {
      const removingTrack = newBody.pop()
      fields[removingTrack.y][removingTrack.x] = ''
    } else {
      const food = getFoodPosition(fields.length, [...newBody, newPosition])
      fields[food.y][food.x] = 'food'
    }
    fields[newPosition.y][newPosition.x] = 'snake'
    newBody.unshift(newPosition)

    setBody(newBody)
    setFields(fields)
    
    return true
  }

  const onChangeDirection = useCallback((newDirection) => {
    if(status !== GameStatus.playing) {
      return
    }
    if(OppositeDirection[direction] === newDirection) {
      return
    }
    setDirection(newDirection)
  },[direction, status])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const newDirection = DirectionKeyCodeMap[e.keyCode]
      if(!newDirection) {
        return
      }

      onChangeDirection(newDirection)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onChangeDirection])

  return (
    <div className="App">
      <header className="header">
        <div className="title-container">
          <h1 className="title">Snake Game</h1>
        </div>
        <Navigation />
      </header>
      <main className="main">
        <Field fields={fields}/>
      </main>
      <footer className="footer">
        <Button status={status} onStart={onStart} onRestart={onRestart} />
        <ManipulationPanel onChange={onChangeDirection}/>
      </footer>
    </div>
  );
}

export default App;
