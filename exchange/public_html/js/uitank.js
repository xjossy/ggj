/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exchange.UITank = function(type,path) {
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
                exchange.isPathClear(this.movable.x,this.movable.y, userTank.movable.x, 
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


