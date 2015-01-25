/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var initEdit = function(edit, gameEngine) {
    var gameParams = gameEngine.gameParams;
    var rows = gameEngine.rows;
    
    var size = gameParams['size'];
    
    var tankCount  = [5,10];
    var tankRadius = [5,0 ];
    
    var gameCont    = document.getElementById('gameCont');
    var tankPalette = document.getElementById('tankPalette');
    
    var updatePalette = function() {
        var items = document.getElementsByClassName('paletteItem');
        for(var i=0;i<items.length;++i) {
            var item = items[i];
            item.innerText = tankCount[i];
            $(item).toggleClass('empty', tankCount[i]===0);
            $(item).toggleClass('full', tankCount[i]!==0);
        }
    };
    
    var selectedItem = -1;
    
    $(document.body).toggleClass('editable', edit);
    //$(tankPalette).toggle(edit);

    var items = document.getElementsByClassName('paletteItem');
    for(var i=0;i<items.length;++i) {
        var item = items[i];
        var idx = i;
        item.onclick = function(idx){return function() {
            if( tankCount[idx]<=0 ) return;
            if( selectedItem>=0 ) {
                $(items[selectedItem]).toggleClass('selected', false);
            }
            
            selectedItem = idx;
            $(items[selectedItem]).toggleClass('selected', true);
        }}(idx);
    }
    
    var dragHandler = null;
    
    var Handler = function(x,y) {
        var handler = this;
        
        this.x = x;
        this.y = y;
        
        this.div = document.createElement('div');
        this.div.className='handler';
        document.body.appendChild(this.div);
        
        this.setPos = function() {
            wd = this.div.clientWidth;
            this.div.style.left = (this.x - wd/2 - 1) + "px";
            this.div.style.top  = (this.y - wd/2 - 1) + "px";
        };
        
        this.div.onmousedown = function(e) {
            if(e.button == 2 ) {
                handler.rClick();
                e.stopPropagation();
                return false;
            }
            if(e.button != 0 ) return;
            
            dragHandler = handler;
            $(dragHandler.div).toggleClass('selected', true);
            handler.movePos(e.pageX,e.pageY);
            
            e.stopPropagation();
            return false;
        };
        
        this.div.oncontextmenu = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        
        this.div.onclick = function(e) {
            e.stopPropagation();
            return false;
        };
        
        this.movePos = function(x,y) {
            this.mx = x;
            this.my = y;
        };
        
        this.moveTo = function(x,y) {
            var px = this.x;
            var py = this.y;
            
            this.x += x - this.mx;
            this.y += y - this.my;
            this.setPos();
            
            for(i in this.onmove) {
                if( this.onmove[i](this, this.x,this.y)===false ) {
                    this.x = px;
                    this.y = py;
                    this.setPos();
                    
                    for(var j=0;j<i;++j) 
                        this.onmove[i](this, this.x,this.y);
                    
                    return;
                }
            }
            
            this.movePos(x,y);
        };
        
        this.endMove = function() {
            for(i in this.onmoveend) {
                this.onmoveend[i](this);
            }
        };
        
        this.rClick = function() {
            for(i in this.onrclick) {
                this.onrclick[i](this);
            }
        };
        
        this.remove = function() {
            if( this.div.parentNode === document.body)
                document.body.removeChild(this.div);
            
        }
        
        this.onmove = [];
        this.onmoveend = [];
        this.onrclick = []
        
        this.setPos();
    }
    
    document.addEventListener('mousemove', function(e){
        if( dragHandler===null ) return true;
        
        dragHandler.moveTo(e.pageX, e.pageY);
        
        e.stopPropagation();
        return false;
    });
    
    document.addEventListener('mouseup', function(e){
        if( dragHandler===null ) return true;
        
        dragHandler.moveTo(e.pageX, e.pageY);
        dragHandler.endMove();
        
        $(dragHandler.div).toggleClass('selected', false);
        dragHandler=null;
        
        e.stopPropagation();
        return false;
    });
    
    var MovableLine = function(h1,h2) {
        var movableLine = this;
        
        this.h1 = h1;
        this.h2 = h2;
        
        this.div = document.createElement('div');
        this.div.className='line';
        document.body.appendChild(this.div);
        
        this.update = function() {
            var dx = movableLine.h2.x - movableLine.h1.x;
            var dy = movableLine.h2.y - movableLine.h1.y;
            
            var dir = Math.atan2(dy,dx) / 2 / Math.PI * 360;
            
            movableLine.div.style.width = Math.sqrt(dx*dx+dy*dy) + "px";
            movableLine.div.style.transform = 
                    "translate("+movableLine.h1.x+"px,"+movableLine.h1.y+"px) rotate(" + dir + "deg)";
        };
        
        this.seth1 = function(h) {
            this.h1=h;
            this.h1.onmove.push(this.update);
        }
        
        this.seth2 = function(h) {
            this.h2=h;
            this.h2.onmove.push(this.update);
        }
        
        this.remove = function() {
            if( this.div.parentNode === document.body)
                document.body.removeChild(this.div);
            
            this.h1.onmove.splice(this.h1.onmove.indexOf(this),1);
            this.h2.onmove.splice(this.h2.onmove.indexOf(this),1);
        }
        
        this.h1.onmove.push(this.update);
        this.h2.onmove.push(this.update);
        
        this.update();
    };
    
    var placesTanks = [];
    
    if( edit ) {
        updatePalette();
        
        /*for(var y=0;y<size;++y) {
            for(var x=0;x<size;++x) {
                var l = function(cx,cy){
                    return function() {*/
        gameCont.onclick = 
            function(e) {
                var cx = e.pageX / gameParams['cellw'];
                var cy = e.pageY / gameParams['cellh'];
                
                if(!('t-100' in gameEngine.movementById)) {
                    return;
                }
                
                var userTank = gameEngine.movementById['t-100'];
                
                var dx = userTank.x - cx;
                var dy = userTank.y - cy;
                
                var distanceToUser = Math.sqrt(dx*dx+dy*dy);
                
                if( selectedItem<0 || tankCount[selectedItem]<=0 ) return;
                if( tankRadius[selectedItem]===0 ) { // this is a wall 
                    if( cx<0||cx>=gameParams.size ) return;
                    if( cy<0||cy>=gameParams.size ) return;
                    
                    if( distanceToUser<gameParams['build-distance-wall'] ) return;
                    for(i in gameEngine.gameUnits) {
                        unit = gameEngine.gameUnits[i];
                        var dx = unit.x - cx;
                        var dy = unit.y - cy;
                        if( dx*dx+dy*dy < unit.radius*unit.radius ) return;
                    }
                    
                    tankCount[selectedItem]--;
                    updatePalette();
                    
                    var cell = gameEngine.rows[Math.floor(cy)][Math.floor(cx)];
                    cell.isWall=true;
                    cell.synhCell();
                    
                    var buildSpec = [['w',Math.floor(cx),Math.floor(cy)]];
                    
                    gameEngine.socket.send('\0' + JSON.stringify(buildSpec) + '\xff');
                    
                    return;
                }
                
                if( distanceToUser<gameParams['build-distance-tank'] ) return;
                    
                if( gameEngine.intersectedWall(cx,cy,gameParams['tankRadius']) !== undefined )
                    return;

                tankCount[selectedItem]--;

                var newTank = new gameEngine.Tank(cx,cy,2+selectedItem);

                newTank.lines = [];
                newTank.handlers = [];

                var h0 = new Handler((cx)*gameParams['cellw'], (cy)*gameParams['cellh']);
                var h1 = new Handler(h0.x-5, h0.y-10);
                
                var playHandler = document.createElement('div')
                playHandler.className = 'playhandler';
                document.body.appendChild(playHandler);
                playHandler.style.left = (h0.x + 20) + "px"
                playHandler.style.top  = (h0.y) + "px"
                
                var removeHandler = function() {
                    if( playHandler.parentNode===document.body )
                        document.body.removeChild(playHandler);
                }
                
                playHandler.onclick = function() {
                    if( gameEngine.intersectedWall(newTank.movable.x,newTank.movable.y,gameParams['tankRadius']) !== undefined )
                        return;
                    
                    var dx = userTank.x - newTank.movable.x;
                    var dy = userTank.y - newTank.movable.y;

                    var distanceToUser = Math.sqrt(dx*dx+dy*dy);
                
                    if( distanceToUser<gameParams['build-distance-tank'] )
                        return;
                    
                    var path = [[h0.x, h0.y]];
                    for(var i in newTank.lines) {
                        var line = newTank.lines[i];
                        path.push([line.h2.x,line.h2.y]);
                    }
                    for(var i in path) {
                        path[i][0] /=  gameParams['cellw'];
                        path[i][1] /=  gameParams['cellh'];
                    }
                    
                    var buildSpec = [['t',path]];
                    gameEngine.socket.send('\0' + JSON.stringify(buildSpec) + '\xff');
                    
                    newTank.remove();
                    for(i=0;i<newTank.handlers.length;++i)
                        newTank.handlers[i].remove();

                    for(i=0;i<newTank.lines.length;++i)
                        newTank.lines[i].remove();
                    removeHandler();
                    
                    return;
                };

                h0.idx = 0;
                h1.idx = 1;

                newTank.handlers.push(h0);
                newTank.handlers.push(h1);

                newTank.spawnerExists = true;

                var moveFnc = function(handler) {
                    var cx = handler.x / gameParams['cellw'];
                    var cy = handler.y / gameParams['cellh'];

                    if( handler.idx===0 ) { 
                        if( gameEngine.intersectedWall(cx,cy,gameParams['tankRadius']) !== undefined )
                            return false;
                        newTank.moveTo(cx,cy);
                        
                        playHandler.style.left = (h0.x + 20) + "px";
                        playHandler.style.top  = (h0.x) + "px";
                    }

                    if( newTank.spawnerExists && handler.idx===newTank.lines.length ) {
                        if( newTank.spawnerExists ) {
                            var nexth = newTank.handlers[handler.idx + 1];

                            nexth.x = handler.x - 5;
                            nexth.y = handler.y - 10;
                            nexth.setPos();
                        }
                    }
                    if( newTank.spawnerExists && handler.idx===newTank.lines.length + 1 ) {
                        var prevh = newTank.handlers[handler.idx - 1];

                        newTank.lines.push(new MovableLine(prevh,handler));
                        newTank.spawnerExists = false;
                    }
                };

                var endFnc = function() {
                    if(!newTank.spawnerExists ) {
                        var lasth = newTank.handlers[newTank.handlers.length - 1];
                        var h = new Handler(lasth.x-5, lasth.y-10);

                        h.onmove.push(moveFnc);
                        h.onmoveend.push(endFnc);
                        h.onrclick.push(removeFnc);
                        h.idx = newTank.handlers.length;

                        newTank.handlers.push(h);
                        newTank.spawnerExists = true;
                    }
                };

                var removeFnc = function(handler) {
                    if( handler.idx===0 ) {
                        tankCount[selectedItem]++;
                        updatePalette();

                        newTank.remove();
                        for(i=0;i<newTank.handlers.length;++i)
                            newTank.handlers[i].remove();

                        for(i=0;i<newTank.lines.length;++i)
                            newTank.lines[i].remove();
                        
                        removeHandler();
                    } else if( handler.idx>newTank.lines.length ) {
                        return false;
                    } else if( handler.idx==newTank.lines.length ){
                        newTank.lines[newTank.lines.length - 1].remove();

                        newTank.lines.splice(newTank.lines.length - 1,1);
                        newTank.handlers.splice(newTank.handlers.length - 2,1);

                        var lasth = newTank.handlers[newTank.handlers.length - 1];
                        var prevh = newTank.handlers[newTank.handlers.length - 2];

                        lasth.x = prevh.x - 5;
                        lasth.y = prevh.y - 10
                        lasth.setPos();
                    } else {
                        newTank.lines[handler.idx].remove();
                        newTank.lines.splice(handler.idx,1);
                        newTank.handlers.splice(handler.idx,1);

                        if( handler.idx < newTank.lines.length  )
                        newTank.lines[handler.idx].seth1(newTank.handlers[handler.idx]);
                        newTank.lines[handler.idx-1].seth2(newTank.handlers[handler.idx]);
                        newTank.lines[handler.idx-1].update();
                    }

                    for(i=0;i<newTank.handlers.length;++i) {
                        newTank.handlers[i].idx = i;
                    }

                    handler.remove();
                };

                h0.onmove.push(moveFnc);
                h0.onmoveend.push(endFnc);

                h1.onmove.push(moveFnc);
                h1.onmoveend.push(endFnc);

                h0.onrclick.push(removeFnc);
                h1.onrclick.push(removeFnc);

                newTank.updateWidget();
                placesTanks.push(newTank);

                updatePalette();
        };
        /*}();
                }(x+.5,y+.5);
                rows[y][x].cell.addEventListener('click',l);
            }
        }*/
    }
};