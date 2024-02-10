import { KHashTable, KMap, KSingletonMap, strcmp, strhash } from "@coldcloude/kai2";
import {KKDirectRenderer,KKStepBroker, KKCompleteInfoPlayer} from "@coldcloude/kakera";

export const MARK_BLANK = -1;
export const MARK_INVALID = -2;

export type Pos = {
    x:number,
    y:number
};

export const poscmp = (a:Pos,b:Pos)=>{
    const sign = a.x-b.x;
    return sign===0?a.y-b.y:sign;
};

export const poshash = (a:Pos)=>{
    return a.x*31+a.y;
};

export class Board {
    width:number;
    height:number;
    status:number[] = [];
    constructor(width:number,height:number,status?:number[]){
        this.width = width;
        this.height = height;
        if(status){
            for(const mark of status){
                this.status.push(mark);
            }
        }
        else{
            for(let i=0; i<width*height; i++){
                this.status.push(MARK_BLANK);
            }
        }
    }
    valid(p:Pos):boolean{
        return p.x>=0&&p.x<this.width&&p.y>=0&&p.y<this.height;
    }
    index(p:Pos):number{
        return p.y*this.width+p.x;
    }
    get(p:Pos):number{
        return this.valid(p)?this.status[this.index(p)]:MARK_INVALID;
    }
    set(p:Pos,v:number){
        if(this.valid(p)){
            this.status[this.index(p)] = v;
        }
    }
}

export abstract class BoardPlayer<A> extends KKCompleteInfoPlayer<A> {
    board:Board;
    constructor(board:Board){
        super();
        this.board = board;
    }
}

export class BoardRenderer extends KKDirectRenderer<Board> {
    board:Board;
    constructor(board:Board){
        super();
        this.board = board;
    }
}

const OBNAME_RENDERER = "renderer";

export abstract class BoardGameBroker<G extends BoardPlayer<A>,O extends BoardRenderer,A> extends KKStepBroker<G,O,void,A,Board>{
    board: Board;
    renderer: O;
    obvmap:KMap<string,Board[]>;
    playerNames:string[] = [];
    cp = 0;
    constructor(board:Board,renderer:O,...players:{name:string,agent:G}[]){
        super(new KHashTable(strcmp,strhash),new KHashTable(strcmp,strhash));
        this.board = board;
        this.renderer = renderer;
        this.observerMap.set(OBNAME_RENDERER,renderer);
        this.obvmap = new KSingletonMap(OBNAME_RENDERER,[this.board]);
        for(const {name:name,agent:agent} of players){
            this.playerNames.push(name);
            this.agentMap.set(name,agent);
        }
    }
    generateAgentCommandsMap():KMap<string,void[]>{
        return new KSingletonMap(this.playerNames[this.cp],[]);
    }
    generateObserverViewsMap():KMap<string,Board[]>{
        return this.obvmap;
    }
}