/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

exchange.init.push(
    function() {
        exchange.rows = [];
        exchange.size = gameParams['size'];
        
        var rows = exchange.rows;
        var size = exchange.size;
        
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
            
        var initField = function() {
            for(var y=0;y<size;++y) {
                var rowArr = [];

                for(var x=0;x<size;++x) {
                    rowArr.push(new CellObj(x,y));
                }

                //gameCont.appendChild(row);
                rows.push(rowArr);
            }
        };
        
        exchange.resetField = function() {
            for(var y=0;y<size;++y) {
                for(var x=0;x<size;++x) {
                    rows[y][x].isWall = (x===0 || x===(size-1) || y===0 || y===(size-1));
                    rows[y][x].deletableWall = false;
                }
            }
        };
        
        exchange.updateField = function() {
            for(var y=0;y<size;++y) {
                for(var x=0;x<size;++x) {
                    rows[y][x].synhCell();
                }
            }
        };
        
        initField();
        exchange.resetField();
        exchange.updateField();
    }
);