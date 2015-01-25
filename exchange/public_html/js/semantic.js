/* 

 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(function() {
    var rows = [];
    
    var gameCont = document.getElementById('gameCont');
    var overlayInner = $('#overlay .overlayInner')[0];
    
    var gameUnits = [];
    
    var gameParams =  {
        'bulletRadius': 1,
        'fireFreq': 2.5,
        'tankRadius' : 1.8,
        'tankDirSpeed' : .2,
        'tankSpeed' : 1/150,
        'cellw' : 8,
        'cellh' : 8,
        'size': 50,
        'ping-interval': 10000,
        'server' :"ws://192.168.1.54:9076/",
        'build-distance-wall' : 5,
        'build-distance-tank' : 10
    };
        
    var size = gameParams['size'];
    
    var CellObj = function(x,y) {
        var cellObj = this;
        /*this.cell = cell;
        this.update = function() {
            $(this.cell).toggleClass('wall', this.isWall);
        };*/
        this.deletableWall = false;
        this.isWall = false;
        this.cell = null;
        
        this.x = x;
        this.y = y;
        
        this.synhCell = function() {
            if( this.isWall && cellObj.cell===null ) {
                cellObj.cell = document.createElement('div');
                cellObj.cell.className = 'game-cell wall';
                cellObj.cell.style.top  = y * gameParams['cellh'] + "px";
                cellObj.cell.style.left = x * gameParams['cellw'] + "px";
                
                document.body.appendChild(cellObj.cell);
            } else if (!this.isWall && cellObj.cell!==null ) {
                if( cellObj.cell.parentNode===document.body )
                    document.body.removeChild(cellObj.cell);
                cellObj.cell = null;
            }
        };
    };
    
    var GameEngine = function() {
        var gameEngine = this;
        
        this.rows = rows;
        this.gameUnits = gameUnits;
        this.gameCont = gameCont;
        
        this.gameCont.style.width  = gameParams['size'] * gameParams['cellw'] + 'px';
        this.gameCont.style.height = gameParams['size'] * gameParams['cellh'] + 'px';
        
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
        
        this.initField = function() {
            for(var y=0;y<size;++y) {
                var rowArr = [];

                for(var x=0;x<size;++x) {
                    rowArr.push(new CellObj(x,y));
                }

                //gameCont.appendChild(row);
                rows.push(rowArr);
            }
        };

        this.fillField = function() {
            for(var y=0;y<size;++y) {
                for(var x=0;x<size;++x) {
                    rows[y][x].isWall = (x===0 || x===(size-1) || y===0 || y===(size-1));
                    rows[y][x].deletableWall = false;
                }
            }
        };

        this.updateField = function() {
            for(var y=0;y<size;++y) {
                for(var x=0;x<size;++x) {
                    rows[y][x].synhCell();
                }
            }
        };
        
        this.changedMovements = [];
        this.deletions = [];
        this.deletedWalls = [];

        this.globalTick = function() {
            if( gameEngine.gameStarted ) {
                if( window.requestAnimationFrame )
                    window.requestAnimationFrame(gameEngine.globalTick);
                else 
                    window.setTimeout(gameEngine.globalTick, 50);
            }
            else return;
            
            gameEngine.changedMovements = [];

            for(var unit in gameUnits) {
                gameUnits[unit].step();
                if( unit < gameUnits.length ) 
                    gameUnits[unit].updateWidget();
            }
            
            if(!gameEngine.editor ) {
                if( gameEngine.changedMovements.length>0 || gameEngine.deletions.length>0 || gameEngine.deletedWalls.length>0 ) {
                    var speedarr = [];
                    var delarr = [];
                    for(var i in gameEngine.changedMovements) {
                        var obj = gameEngine.changedMovements[i];
                        speedarr.push([obj.id, obj.x, obj.y, obj.dir, obj.type,
                            obj.speed,obj.dirspeed]);
                    }
                    for(var i in gameEngine.deletions) {
                        delarr.push(gameEngine.deletions[i].id);
                    }
                    gameEngine.socket.send('\0' + JSON.stringify([speedarr, delarr, gameEngine.deletedWalls]) + '\ff');
                    gameEngine.deletions = [];
                    gameEngine.deletedWalls = [];
                }
                
                var x = (gameEngine.userTank.movable.x - gameParams['tankRadius']) * gameParams['cellw'];
                var y = (gameEngine.userTank.movable.y - gameParams['tankRadius']) * gameParams['cellh'];
                
                overlayInner.style.left = (x - 750) + "px";
                overlayInner.style.top  = (y - 750) + "px";
            }
        };
        
        this.startGame = function() {
            gameEngine.initField();
            gameEngine.fillField();
            gameEngine.updateField();
            
            this.startServerDialog();
        };
        
        this.avaitingConnection = true;
        this.gameStarted = false;
        this.editor = false;
        this.avaitingGame = false;
        this.movementById = [];
        this.userTank = null;
        
        this.sendPing = function() {
            if(!gameEngine.avaitingGame ) return;
            
            gameEngine.socket.send('\0PING\xFF');
            window.setTimeout(gameEngine.sendPing, gameParams['ping-interval']);
        };
        
        this.startServerDialog = function() {
            if(!gameEngine.avaitingConnection ) return;

            try {
                gameEngine.socket = new WebSocket(gameParams['server']);
            } catch(e) {
                setTimeout(gameEngine.startServerDialog, 1000);
                return;
            }
            gameEngine.socket.onmessage = function(event) {
                if( gameEngine.avaitingGame ) {
                    if( event.data==='PLAY' )
                        gameEngine.startPlayer();
                    if( event.data==='EDIT' )
                        gameEngine.startEditor();
                } else if(event.data==='CLOSE') {
                } else if( gameEngine.editor ) {
                    var data = JSON.parse(event.data);
                    for(i in data[0]) {
                        var speeds = data[0][i];
                        
                        if(!(speeds[0] in gameEngine.movementById)) {
                            var movable;
                            if( speeds[0][0]==='t' ) {
                                var tank = new Tank(speeds[1], speeds[2], speeds[3], speeds[4]);
                                movable = tank.movable;
                            } else if( speeds[0][0]==='b' ) {
                                var bullet = new Bullet(speeds[1], speeds[2], speeds[3]);
                                movable = bullet.movable;
                            }
                            movable.id = speeds[0];
                            gameEngine.movementById[movable.id] = movable;
                            
                            gameEngine.gameUnits.push(movable);
                        }
                        var movable = gameEngine.movementById[speeds[0]];
                        movable.x = speeds[1];
                        movable.y = speeds[2];
                        movable.dir = speeds[3];
                        movable.speed = speeds[5];
                        movable.dirspeed = speeds[6];
                    }
                    for(i in data[1]) {
                        var id = data[1][i];
                        
                        if( id in gameEngine.movementById ) {
                            gameEngine.movementById[id].remove();
                        }
                    }
                    for(i in data[2]) {
                        var xy = data[2][i];
                        var cell = gameEngine.rows[xy[1]][xy[0]];
                        
                        cell.isWall = false;
                        cell.synhCell();
                    }
                } else {
                    var data = JSON.parse(event.data);
                    for(i in data) {
                        var spec = data[i];
                        if(spec[0]==='w') {
                            var cell = gameEngine.rows[spec[2]][spec[1]];
                            cell.isWall=true;
                            cell.deletableWall = true;
                            cell.synhCell();
                        } else if(spec[0]==='t') {
                            path = spec[1];
                            
                            var t = new UITank(4, path);
                            gameUnits.push(t);
                        }
                    }
                }
            };

            gameEngine.socket.onopen = function() {
                gameEngine.avaitingGame = true;
                gameEngine.avaitingConnection = false;
                window.setTimeout(gameEngine.sendPing, gameParams['ping-interval']);
            };
            gameEngine.socket.onerror = function() {
                setTimeout(gameEngine.startServerDialog, 1000);
                return;
            };
        };
        
        this.startGameProcess = function() {
            gameEngine.avaitingGame = false;
            gameEngine.gameStarted = true;
            gameEngine.gameStartTime = (new Date()).getTime();
        };
        
        this.startPlayer = function() {
            gameEngine.startGameProcess();
            gameEngine.editor = false;
            
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
            gameEngine.editor = true;
            
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
    
    var pathClear = function(x1,y1, x2,y2, r) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        
        if( Math.abs(dx) > Math.abs(dy) ) {
            if( x1 > x2 ) {
                x1 = [x2,x2=x1][0];
                y1 = [y2,y2=y1][0];
            }
            for(var x=x1-r;x<x2 + r + 1;++x) {
                if(x<0) continue;
                if(x>=size) continue;
                
                var yc = (y1 * (x2 - x) + y2 * (x - x1)) / (x2 - x1);
                for(var y = yc-r;y<yc+r+1;++y) {
                    if(y<0) continue;
                    if(y>=size) continue;
                    
                    if( rows[Math.floor(y)][Math.floor(x)].isWall ) return false;
                }
            }
        } else {
            if( y1 > y2 ) {
                x1 = [x2,x2=x1][0];
                y1 = [y2,y2=y1][0];
            }
            for(var y=y1-r;y<y2 + r + 1;++y) {
                if(y<0) continue;
                if(y>=size) continue;
                
                var xc = (x1 * (y2 - y) + x2 * (y - y1)) / (y2 - y1);
                for(var x = xc-r;x<xc+r+1;++x) {
                    if(x<0) continue;
                    if(x>=size) continue;
                    
                    if( rows[Math.floor(y)][Math.floor(x)].isWall ) return false;
                }
            }
        }
        
        return true;
    };
    
    var Movable = function(x, y, dir, div) {
        var movable = this;
        
        this.x = x;
        this.y = y;
        this.dir = dir;
        
        this.speed = 0;
        this.dirspeed = 0;
        this.prevSpeed = [null,null];
        
        this.div = div;
        
        gameCont.appendChild(this.div);
        
        this.updateWidget = function() {
            this.div.style.transform = "translate("+
                    this.x*gameParams['cellw']+"px,"+
                    this.y*gameParams['cellh']+"px) rotate(" + this.dir + "deg)";
        };
        
        this.prevTime = (new Date()).getTime();
        
        this.onIntersectWall = function(wall) {};
        
        this.remove = function() {
            if(!(movable in gameEngine.deletions)) {
                gameEngine.deletions.push(movable);
            }
            if( div.parentNode===gameCont )
                gameCont.removeChild(div);
        };
        
        this.moveFwd = function(length) {
            var px = this.x;
            var py = this.y;
            
            this.x += length * Math.cos(this.dir*2*Math.PI / 360);
            this.y += length * Math.sin(this.dir*2*Math.PI / 360);
            
            wall = gameEngine.intersectedWall(this.x, this.y, this.radius);
            
            if( wall!==undefined ) {
                this.x = px;
                this.y = py;
                
                this.onIntersectWall(wall);
            }
        };
        
        this.step = function() {
            if( this.speed!==this.prevSpeed[0] || this.dirspeed!==this.prevSpeed[1] ) {
                if(!(this in gameEngine.changedMovements)) {
                    gameEngine.changedMovements.push(this);
                }
            }
            
            this.prevSpeed[0] = this.speed;
            this.prevSpeed[1] = this.dirspeed;
            
            var ctime = (new Date()).getTime();
            var timeDelta = ctime - this.prevTime;
            
            this.moveFwd(timeDelta * this.speed);
            this.dir += timeDelta * this.dirspeed;
            
            this.prevTime = ctime;
        };
        
        this.updateWidget();
    };
    
    var Tank = function(x, y, dir, type) {
        var tank = this;
        
        this.type = type;
        this.phase = 0;
        
        this.lastFireTime = 0;
        
        this.div = document.createElement('div');
        this.div.className = "tank";
        
        this.movable = new Movable(x,y,dir, this.div);
        
        this.alive = true;
        
        gameEngine.tanks.push(this);
        
        this.movable.id = 't'+gameEngine.getId();
        this.movable.radius = gameParams['tankRadius'];
        this.movable.type = type;
        
        this.updateWidget = function() {
            this.div.style.backgroundPositionX = ((this.phase % 8) * 24) + "px";
            this.div.style.backgroundPositionY = ((this.type  % 8) * 24) + "px";
            
            this.movable.updateWidget();
        };
        
        this.damage = function() {
            tank.alive = false;
            tank.remove();
        };
        
        this.moveTo = function(x,y) {
            this.movable.x = x;
            this.movable.y = y;
            this.movable.updateWidget();
        };
        
        this.step = function() {
            if( this.movable.speed!==0 ) {
                this.phase = (this.phase + 1) % 8;
            }
            
            this.movable.step();
        };
        
        this.getDirTo = function(x,y) {
            return Math.atan2(y - this.movable.y, x - this.movable.x) / Math.PI / 2 * 360;
        };
        
        this.fire = function() {
            var ctime = (new Date()).getTime();
            
            if( ctime-this.lastFireTime < 1000 / gameParams['fireFreq'] ) return;
            
            var bullet = new Bullet(this.movable.x, this.movable.y, this.movable.dir);
            bullet.firedBy = tank;
            
            this.lastFireTime = ctime;
        };
        
        this.remove = function() {
            this.movable.remove();
            var idx = gameUnits.indexOf(this);
            if( idx>=0 ) gameUnits.splice(idx,1);
        };
    };
    
    gameEngine.Tank = Tank;
    
    var UITank = function(type,path) {
        var dir = 0;
        if( path.length>1 ) {
            dir = Math.atan2(path[1][1] - path[0][1], path[1][0] - path[0][0]) / Math.PI / 2 * 360;
            this.dstPoint = path[1];
        }
        
        this.dstTime = 0;
        
        this.init = Tank;
        this.init(path[0][0],path[0][1],dir,type);
        
        this.pathElem = 1;
        this.pathdir = 1;
        
        var ST_MOVING=0;
        var ST_ROTATING=1;
        var ST_FIREENEMY=2;
        
        this.state = ST_ROTATING;
        
        this.startRotating = function(ctime) {
            var dstDir = this.getDirTo(this.dstPoint[0], this.dstPoint[1]);
            var ang = dstDir - this.movable.dir;
            if( ang < -180 ) ang += 360;
            if( ang >  180 ) ang -= 360;

            if( ang<0 ) this.movable.dirspeed = -gameParams['tankDirSpeed'];
            else this.movable.dirspeed = gameParams['tankDirSpeed'];

            this.dstTime = ctime + ang / this.movable.dirspeed;

            this.state = ST_ROTATING;
            this.movable.speed = 0;
        };
        
        this.movable.onIntersectWall = function() {
            this.pathdir = -this.pathdir;
            
            this.pathElem += this.pathdir;
            if( this.pathElem<0 ) this.pathElem = 0;
            if( this.pathElem>=path.length-1 ) this.pathElem=path.length;
            
            this.dstPoint = path[this.pathElem];
            this.startRotating((new Date()).getTime());
        };
        
        this.superStep = this.step;
        this.step = function() {
            var userTank = gameEngine.userTank;
            
            var ctime = (new Date()).getTime();
            
            var dx = this.movable.x - userTank.movable.x;
            var dy = this.movable.y - userTank.movable.y;
            
            if( dx*dx + dy*dy < 100 && 
                    pathClear(this.movable.x,this.movable.y, userTank.movable.x, 
                    userTank.movable.y, gameParams['bulletRadius']) && userTank.alive ) {
                        
                var dstDir = this.getDirTo(userTank.movable.x, userTank.movable.y);
                var ang = dstDir - this.movable.dir;
                if( ang < -180 ) ang += 360;
                if( ang >  180 ) ang -= 360;
                
                this.state = ST_FIREENEMY;
                this.movable.speed = 0;
                
                if( Math.abs(ang)<gameParams['tankDirSpeed']*(ctime - this.movable.prevTime) ) {
                    this.movable.dir = dstDir;
                    this.movable.dirspeed = 0;
                    this.fire();
                } else {
                    if( ang<0 ) this.movable.dirspeed = -gameParams['tankDirSpeed'];
                    else this.movable.dirspeed = gameParams['tankDirSpeed'];
                }
            } else if(this.state === ST_FIREENEMY) {
                this.startRotating(ctime);
            } else {
                if( this.state === ST_MOVING ) {
                    if( ctime>=this.dstTime ) {
                        this.movable.x = this.dstPoint[0];
                        this.movable.y = this.dstPoint[1];

                        this.pathElem+=this.pathdir;

                        if( this.pathElem + 1>=path.length ) {
                            this.pathdir = -1;
                        }

                        if( this.pathElem < 0 ) {
                            this.pathElem = 1;
                            this.pathdir = 1;
                        }

                        this.dstPoint = path[this.pathElem];

                        this.startRotating(ctime);
                    }
                    else {
                        this.movable.dir = this.getDirTo(this.dstPoint[0], this.dstPoint[1]);

                        this.movable.speed = gameParams['tankSpeed'];
                        this.movable.dirspeed = 0;
                    }
                } else if ( this.state === ST_ROTATING ) {
                    if( ctime>=this.dstTime ) {
                        var dx = (this.dstPoint[0] - this.movable.x);
                        var dy = (this.dstPoint[1] - this.movable.y);

                        this.dstTime = ctime + Math.sqrt(dx*dx+dy*dy) / gameParams['tankSpeed'];

                        this.state = ST_MOVING;
                        this.movable.dirspeed = 0;
                    }
                    else {
                        //this.movable.dirspeed = .2;
                    }
                }
            }

            this.superStep();
        };
    };
    
    //var t = new UITank(4, [[20,20],[30,20],[20,30]]);
    //gameUnits.push(t);
    
    var Bullet = function(x,y,dir) {
        var bullet = this;
        
        this.div = document.createElement('div');
        this.div.className = "bullet";
        
        this.movable = new Movable(x,y,dir, this.div);
        this.movable.speed = .03;
        this.movable.id = 'b'+gameEngine.getId();
        
        this.movable.radius = gameParams['bulletRadius'];
        
        this.updateWidget = function() {
            this.movable.updateWidget();
        };
        
        this.step = function() {
            this.movable.step();
            if( gameEngine.editor ) return;
            for(var i in gameEngine.tanks) {
                var tank = gameEngine.tanks[i];
                
                if(!tank.alive || tank===bullet.firedBy) continue;
                
                var dx = tank.movable.x - this.movable.x;
                var dy = tank.movable.y - this.movable.y;
                
                if( dx*dx+dy*dy<gameParams['tankRadius']*gameParams['tankRadius'] ) {
                    bullet.remove();
                    tank.damage();
                }
            }
        };
        
        this.movable.onIntersectWall = function(wall) {
            bullet.remove();
            if( gameEngine.editor ) return;
            if( wall[1]<0 || wall[0]<0 || wall[0]>=size || wall[1] >=size ) return;
            
            var cell = gameEngine.rows[Math.floor(wall[1])][Math.floor(wall[0])];
            if( cell.deletableWall && cell.isWall ) {
                cell.isWall = false;
                cell.synhCell();
                
                gameEngine.deletedWalls.push([cell.x, cell.y]);
            }
        };
        
        gameUnits.push(this);
        
        this.remove = function() {
            this.movable.remove();
            var idx = gameUnits.indexOf(this);
            if( idx>=0 ) gameUnits.splice(idx,1);
        };
    };
    
    //var userTank = new Tank(10, 10 ,0, 1);
    //gameUnits.push(userTank);
    
    var moveFwd = 0;
    var moveBwd = 0;
    var moveL = 0;
    var moveR = 0;
    //tank.speed = .1;
    //tank.dirspeed = .2;
    
    var updSpeed = function() {
        if( gameEngine.userTank===null ) return;
        
        gameEngine.userTank.movable.speed = (moveFwd - moveBwd) * gameParams['tankSpeed'];
        gameEngine.userTank.movable.dirspeed = (moveR - moveL) * gameParams['tankDirSpeed'];
    };
    
    document.body.onkeydown = function(e) {
        if( e.keyCode === 38 ) moveFwd = 1;
        if( e.keyCode === 40 ) moveBwd = 1;
        if( e.keyCode === 37 ) moveL = 1;
        if( e.keyCode === 39 ) moveR = 1;
        
        updSpeed();
    };
    
    document.body.onkeyup = function(e) {
        if( e.keyCode === 38 ) moveFwd = 0;
        if( e.keyCode === 40 ) moveBwd = 0;
        if( e.keyCode === 37 ) moveL = 0;
        if( e.keyCode === 39 ) moveR = 0;
        
        updSpeed();
    };
    
    document.body.onkeypress = function(e) {
        if( gameEngine.userTank===null ) return;
        
        if( e.charCode === 32 ) gameEngine.userTank.fire();
    };
    
    gameEngine.startGame();
    
    initEdit(true, gameEngine);
});