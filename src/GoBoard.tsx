import * as React from "react";

import { Board, BoardRenderer, MARK_BLANK, Pos } from "./BoardGame.js";
import { GoPlayer } from "./GoBoardGame.js";

import "./go-board.css";
import { render } from "react-dom";

type GoPos = {
    x:number,
    y:number,
    mark:number
};

const buildGrids = (board:Board)=>{
    const rst:Pos[] = [];
    for(let x=0; x<=board.width; x++){
        for(let y=0; y<=board.height; y++){
            rst.push({x:x,y:y});
        }
    }
    return rst;
};

const buildStones = (board:Board)=>{
    const rst:GoPos[] = [];
    for(let x=0; x<board.width; x++){
        for(let y=0; y<board.height; y++){
            const mark = board.get({x:x,y:y});
            rst.push({x:x,y:y,mark:mark});
        }
    }
    return rst;
};

export default function GoBoard(props:{
    left:number,
    top:number,
    renderer:BoardRenderer,
    players: GoPlayer[]
}){
    //choose player
    let cp:GoPlayer = props.players[0];
    for(const player of props.players){
        player.activeEvent.register(()=>cp = player);
    }
    //set grids
    const grids = buildGrids(props.renderer.board)
    //hook status
    const [stones,setStones] = React.useState<GoPos[]>(buildStones(props.renderer.board));
    props.renderer.drawEvent.register((board)=>{
        setStones(buildStones(board));
    });
    const selectHandler = (pos:Pos)=>{
        cp.trySelectAction(pos);
    };
    return (
        <>
            <div className="board" style={{left:props.left+"px",top:props.top+"px",width:(props.renderer.board.width*50)+"px",height:(props.renderer.board.height*50)+"px"}}>{
                 grids.map((p:Pos)=>{
                    const gleft = (p.x*50-25)+"px";
                    const gtop = (p.y*50-25)+"px";
                    return (
                        <div className="square" style={{left:gleft,top:gtop}}></div>
                    );
                }).concat(stones.map((p:GoPos)=>{
                    const sleft = (p.x*50+3)+"px";
                    const stop = (p.y*50+3)+"px";
                    let sclass = "stone ";
                    switch(p.mark){
                        case MARK_BLANK:
                            sclass += "blank";
                            break;
                        case 0:
                            sclass += "black";
                            break;
                        case 1:
                            sclass += "white";
                            break;
                    }
                    return (
                        <div className={sclass} style={{left:sleft,top:stop}} onClick={()=>{
                            selectHandler({x:p.x,y:p.y});
                        }}></div>
                    );
                }))
            }</div>
        </>
    );
}
