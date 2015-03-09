/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exchange.isPathClear = function(x1,y1, x2,y2, r) {
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
