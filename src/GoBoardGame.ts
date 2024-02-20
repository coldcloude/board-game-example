import { KHashTable, KAVLTree, KMap } from "@coldcloude/kai2";
import {Pos, Board, BoardRenderer, BoardGameBroker, MARK_INVALID, MARK_BLANK, poscmp, poshash, BoardPlayer} from "./BoardGame.js";

const DELTA_NRIGHBOR = [[-1,0],[0,1],[1,0],[0,-1]];

export class GoBlock {
    pos:Pos;
    mark:number;
    stones = new KHashTable<Pos,void>(poscmp,poshash);
    liberties = new KHashTable<Pos,void>(poscmp,poshash);
    neighbors = new KHashTable<Pos,void>(poscmp,poshash);
    constructor(board:Board,pos:Pos,mark:number){
        this.pos = pos;
        this.mark = mark;
        this.stones.set(pos);
        for(const [dx,dy] of DELTA_NRIGHBOR){
            const neighbor = {x:pos.x+dx,y:pos.y+dy};
            const nMark = board.get(neighbor);
            if(nMark!==MARK_INVALID){
                this.neighbors.set(neighbor);
                if(nMark===MARK_BLANK){
                    this.liberties.set(neighbor);
                }
            }
        }
    }
    mergeSingle(other:GoBlock){
        this.stones.set(other.pos);
        other.liberties.foreach((pos:Pos)=>{
            this.liberties.set(pos);
        });
        this.neighbors.get(other.pos,true);
        other.liberties.foreach((pos:Pos)=>{
            if(!this.stones.get(pos)){
                this.neighbors.set(pos);
            }
        });
    }
}

export function goFindBlocks(board:Board):GoBlock[]{
    //build single map
    const singleMap = new KAVLTree<Pos,GoBlock>(poscmp);
    for(let x=0; x<board.width; x++){
        for(let y=0; y<board.width; y++){
            const stone = {x:x,y:y};
            const mark = board.get(stone);
            if(mark>=0){
                const block = new GoBlock(board,stone,mark);
                singleMap.set(block.pos,block);
            }
        }
    }
    //depth first search
    const rst:GoBlock[] = [];
    const queue:GoBlock[] = [];
    let pending:GoBlock|undefined = undefined;
    while(singleMap.size>0||queue.length>0){
        //renew block
        let curr:GoBlock|undefined = queue.shift();
        if(curr===undefined){
            const $ = singleMap.getFirst(true)!;
            curr = $.value;
            pending = curr;
            rst.push(pending!);
        }
        //push neibors
        if(curr!=undefined){
            curr.neighbors.foreach((pos:Pos)=>{
                const nbn = singleMap.getNode(pos);
                if(nbn!==undefined){
                    const nb = nbn.value;
                    if(nb.mark===pending!.mark){
                        singleMap.removeNode(nbn);
                        pending!.mergeSingle(nb);
                        queue.push(nb);
                    }
                }
            });
        }
    }
    return rst;
}

export function goApplyAction(mark:number,action:Pos,board:Board,blocks?:GoBlock[]){
    board.set(action,mark);
    blocks = blocks||goFindBlocks(board);
    for(const block of blocks){
        if(block.mark!==mark&&block.liberties.size===0){
            block.stones.foreach((p)=>{
                board.set(p,MARK_BLANK);
            });
        }
    }
}

export function goCheckBoard(board:Board,blocks?:GoBlock[]){
    blocks = blocks||goFindBlocks(board);
    for(const block of blocks){
        if(block.liberties.size===0){
            return undefined;
        }
    }
    return blocks;
}

export function goCheckAction(board:Board,mark:number,action:Pos):number[]|undefined{
    if(board.get(action)!==MARK_BLANK){
        return undefined;
    }
    else{
        const b = new Board(board.width,board.height,board.status);
        goApplyAction(mark,action,b);
        const blocks = goCheckBoard(b);
        if(blocks!==undefined){
            return b.status;
        }
        else{
            return undefined;
        }
    }
}

export type GoBoardState = {
    status: number[],
    blocks: GoBlock[]
};

export class GoPlayer extends BoardPlayer<Pos>{
    mark:number;
    constructor(board:Board,mark:number){
        super(board);
        this.mark = mark;
    }
    checkAction(action:Pos):boolean {
        return goCheckAction(this.board,this.mark,action)!==undefined;
    }
    findValidActions():KMap<Pos,GoBoardState>{
        const actionMap = new KHashTable<Pos,GoBoardState>(poscmp,poshash);
        for(let x=0; x<this.board.width; x++){
            for(let y=0; y<this.board.height; y++){
                const action = {x:x,y:y};
                if(goCheckAction(this.board,this.mark,action)){
                    const b = new Board(this.board.width,this.board.height,this.board.status);
                    goApplyAction(this.mark,action,b);
                    const blocks = goCheckBoard(b);
                    if(blocks!==undefined){
                        actionMap.set(action,{
                            status: b.status,
                            blocks: blocks
                        });
                    }
                }
            }
        }
        return actionMap;
    }
}

export class GoBroker<G extends GoPlayer,O extends BoardRenderer> extends BoardGameBroker<G,O,Pos> {
    async init(){
        await this.renderer.updateViews([this.board]);
    }
    execute(actionMap: KMap<string, Pos>):boolean {
        const {key:player,value:action} = actionMap.getFirst()!;
        if(player===this.playerNames[this.cp]){
            const newStatus = goCheckAction(this.board,this.cp,action);
            if(newStatus!==undefined){
                this.board.status = newStatus;
                this.cp = 1-this.cp;
                return true;
            }
            else{
                return false;
            }
        }
        else{
            return false;
        }
    }
}
