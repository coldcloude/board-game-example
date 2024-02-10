import React from 'react';
import ReactDOM from 'react-dom/client';
import GoBoard from './GoBoard.tsx';
import { Board, BoardRenderer } from './BoardGame.js';
import { GoBroker, GoPlayer } from './GoBoardGame.ts';

import './index.css';

const board = new Board(4,4);

const renderer = new BoardRenderer(board);

const blackPlayer = new GoPlayer(board,0);
const whitePlayer = new GoPlayer(board,1);

const gameBroker = new GoBroker(board,renderer,{name:"black",agent:blackPlayer},{name:"white",agent:whitePlayer});

gameBroker.init();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoBoard left={100} top={100} renderer={renderer} players={[blackPlayer,whitePlayer]}/>
  </React.StrictMode>,
);

gameBroker.start();
