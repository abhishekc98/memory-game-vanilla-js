import CONSTANTS from './constants.js';

export default class Game {
    constructor(props = {}) {
        this.totalBlocks = props?.totalBlocks || 15;
        this.memoryBlocks = new Array(this.totalBlocks);
        this.loadedBlocks = 0;
        this.highScore = this.fetchHighScore();
        this.initializeAttr();
    }
    initializeAttr() {
        this.updateScores(0);
        this.blocksToBlink = [];
        this.numBlocksToBlink = 1,
        this.readyToVerify = false;
        this.verifyClickStarted = false
    }
    async _load() {
        return new Promise((resolve) => {
            const uiBlocksContainer = document.getElementById('blocks-container');
            while(this.loadedBlocks < this.totalBlocks) {
                const uiBlock = document.createElement('div');
                uiBlock.id = `block-${this.loadedBlocks}`
                uiBlock.classList.add('block');
                uiBlock.dataset.blockindex = this.loadedBlocks;
                uiBlock.addEventListener('click', this.verifyPlayerClick.bind(this))
                uiBlocksContainer?.appendChild(uiBlock);
                this.loadedBlocks++;
            }
            this.startBtnEvents().attachClickListener();

            resolve();
        });
    }
    startBtnEvents() {
        const uiStartBtn = document.getElementById('start-btn');
        const attachClickListener = () => {
            uiStartBtn.addEventListener('click', this.start.bind(this));
        }
        const enable = () => {
            uiStartBtn.removeAttribute('disabled');
        }
        const disable = () => {
            uiStartBtn.setAttribute('disabled', true);
        }
        return { attachClickListener, enable, disable };
    }
    async start(resume = true) {
        this.startBtnEvents().disable();
        if(!resume) {
            this.numBlocksToBlink = 1;
        }
        while(this.numBlocksToBlink <= this.totalBlocks) {
            await this.blink(this.numBlocksToBlink);
            this.numBlocksToBlink++;
            break;
        };
    }
    async blink(numBlocksToBlink) {
        return new Promise(async (resolve) => {
            // Set Blocks to blink
            this.blocksToBlink = [];
            while(numBlocksToBlink) {
                this.blocksToBlink.push(Math.floor(Math.random() * this.totalBlocks));
                numBlocksToBlink--;
            }
            this.readyToVerify = false;
            // Start Blinking the block one by one 
            for(const blockId of this.blocksToBlink) {
                await this.blinkCurrBlock(blockId);
            }
            this.readyToVerify = true;
            resolve();
        })
    }
    async blinkCurrBlock(blockId, colour = 'blue') {
        const uiBlock = this.getUIBlockElmById(blockId);
        await new Promise((res) => {
            setTimeout(() => {
                uiBlock.dataset.blinked = true;
                uiBlock.classList.add('blinked-'+colour);
                res();
            }, 100)
        });
        await new Promise((res) => {
            setTimeout(() => {
                uiBlock.dataset.blinked = false;
                uiBlock.classList.remove('blinked-'+colour);
                res();
            }, 300);
        });
    }
    async verifyPlayerClick(event) {
        if(!this.readyToVerify || this.verifyClickStarted) {
            return;
        }
        this.verifyClickStarted = true;
        const blockNumberToVerify = this.blocksToBlink[0];
        const blockNumberClicked = parseInt(event.target.dataset.blockindex);
        
        if(blockNumberClicked === blockNumberToVerify) {
            this.blocksToBlink.shift();
            
            // Blink curr block to blue
            await this.blinkCurrBlock(blockNumberToVerify, 'green');

            // If all clicks are correct, start next iteration of blink
            if(this.blocksToBlink.length === 0) {
                this.updateScores(this.score + 1);
                this.start();
            }
        } else {
            await Promise.all([
                this.blinkCurrBlock(blockNumberClicked, 'red'),
                this.shakeContainer()
            ]);
            this.initializeAttr();
            this.startBtnEvents().enable();
        }
        this.verifyClickStarted = false;
    }
    async shakeContainer() {
        const container = document.getElementById('blocks-container')
        container.classList.add('shake')
        await new Promise((resolve) => {
            setTimeout(() => {
                container.classList.remove('shake');
                resolve();
            }, 400)
        })
    }
    getUIBlockElmById(id) {
        return document.getElementById(`block-${id}`)
    }

    fetchHighScore() {

        const memoryGame = localStorage.getItem(CONSTANTS.LOCAL_STORAGE_MEMORY_GAME);
        if(!memoryGame) {
            localStorage.setItem(
                CONSTANTS.LOCAL_STORAGE_MEMORY_GAME, 
                JSON.stringify({ highScore: 0 })
            );
            return 0;
        }
        const parsedMemoryGame = JSON.parse(memoryGame);
        if(parsedMemoryGame.hasOwnProperty('highScore')) {
            document.getElementById('highscore').innerHTML = 'High Score: '+parsedMemoryGame.highScore;
            return parsedMemoryGame.highScore;
        }
    }

    setHighScore(highScore) {
        this.highScore = highScore;
        localStorage.setItem(
            CONSTANTS.LOCAL_STORAGE_MEMORY_GAME, 
            JSON.stringify({ highScore: this.highScore })
        );
    }

    updateScores(score = 0) {
        this.score = score
        document.getElementById('score').innerHTML = 'Score: '+this.score;
        if(this.score > this.highScore) {
            this.setHighScore(this.score);
            document.getElementById('highscore').innerHTML = 'High Score: '+this.highScore;
        }
    }
}