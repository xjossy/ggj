/* 

 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(function() {
    
    
    var gameUnits = [];
        
    
    
    var GameEngine = function() {
        var gameEngine = this;
        
        this.rows = rows;
        this.gameUnits = gameUnits;
        this.gameCont = gameCont;
        
        this.gameCont.style.width  = exchange.gameParams['size'] * exchange.gameParams['cellw'] + 'px';
        this.gameCont.style.height = exchange.gameParams['size'] * exchange.gameParams['cellh'] + 'px';
        
        this.tanks = [];
        
        this.intersectedWall = function(x,y,radius) {
            for(var yy = y - radius; yy< y+radius + 1;++yy) {
                if(yy<0) return [x,0];
                if(yy>=size) return [x,size-1];
                for(var xx = x - radius; xx< x+radius + 1;++xx) {
                    if(xx<0) return [0,yy];
                    if(xx>=size) return [size-1,yy];

                    var dx = xx - x;
                    var dy = yy - y;
                    if( dx*dx + dy*dy > radius*radius ) continue;

                    if(rows[Math.floor(yy)][Math.floor(xx)].isWall) return [xx,yy];
                }
            }
            return undefined;
        };
        this.gameParams = gameParams;
        
        this.changedMovements = [];
        this.deletions = [];
        this.deletedWalls = [];

        
        
        this.startGame = function() {
            //gameEngine.initField();
            
            this.startServerDialog();
        };
        
        this.avaitingConnection = true;
        this.gameStarted = false;
        this.isEditor = false;
        this.avaitingGame = false;
        this.movementById = [];
        this.userTank = null;
        
        this.startGameProcess = function() {
            exchange.resetField();
            exchange.updateField();
            
            gameEngine.avaitingGame = false;
            gameEngine.gameStarted = true;
            gameEngine.gameStartTime = (new Date()).getTime();
        };
        
        this.startPlayer = function() {
            gameEngine.startGameProcess();
            gameEngine.isEditor = false;
            
            gameEngine.userTank = new Tank(2,2,45,0);
            gameEngine.userTank.movable.id = 't-100';
            gameEngine.gameUnits.push(this.userTank);
            
            var overlay = document.getElementById('overlay');
            overlay.style.display = 'block';
            
            overlay.style.left = gameParams['cellw'] + 'px';
            overlay.style.top  = gameParams['cellh'] + 'px';
            
            overlay.style.width  = gameParams['cellw']*(size-2) + 'px';
            overlay.style.height = gameParams['cellh']*(size-2) + 'px';
            
            gameEngine.globalTick();
        };
        
        this.startEditor = function() {
            gameEngine.startGameProcess();
            gameEngine.isEditor = true;
            
            gameEngine.globalTick();
        };
        
        this.stopGame = function() {
            for(i in gameEngine.gameUnits) {
                gameEngine.gameUnits[i].remove();
            }
            gameEngine.gameStarted = false;
            gameEngine.movementById = [];
        };
        
        this.maxid = 0;
        
        this.getId = function() {
            return gameEngine.maxid++;
        };
    };
    
    var gameEngine = new GameEngine();
    
    //var t = new UITank(4, [[20,20],[30,20],[20,30]]);
    //gameUnits.push(t);
    
    
    
    //var userTank = new Tank(10, 10 ,0, 1);
    //gameUnits.push(userTank);
    
    
    
    gameEngine.startGame();
    
    initEdit(true, gameEngine);
});