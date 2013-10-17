(function(){
	
	var db;
	
	// Supported without prefix: IE10, Moz16+, Opera14+.
	// Supported with Prefix: Chrome, BlackBerry10 and Firefox15
	// Unsupported: Opera Presto (< 14), Safari 
	
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    
    // FF, IE10 and Chrome21+ use strings while older Chrome used constants
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    if(IDBTransaction) {
	    IDBTransaction.READ_WRITE = IDBTransaction.READ_WRITE || 'readwrite';
	    IDBTransaction.READ_ONLY = IDBTransaction.READ_ONLY || 'readonly';
	}
 
    var data = {};
    
   
	function init() {
	   var button = document.getElementById('addButton');
	   button.addEventListener('click', addItem);   
	   
	   openDB(); 
      
	}
    
    function openDB() {
    	if(typeof indexedDB === 'undefined') {
        	// iDB unsupported -- iOS, Opera, other older browsers
        	alert('Your Browser does not support IndexedDB!');
        	return;
        }
        
        if(indexedDB === null) {
        	// possibly running the app from local file on older Firefox
        	alert('IndexedDB cannot run locally on some browsers. Try running this app from a server.')
        	return;
        }
        
        var req = indexedDB.open('demoDB'); 
        req.onsuccess = function(e) {
        	db = e.target.result;
        	console.log(db);
        	
        	// For BB10 and Chrome < 23 (including Chrome Mobile v18) -- newer Chrome & FF deprecated it and use onupgradeneeded event
        	
        	if(typeof db.setVersion === 'function') {
	        	console.log('browser using deprecated setVersion');
	        	
	        	if(db.version != 1) {
	        		console.log('setting new version with setVersion');
		            var setVersionReq = db.setVersion(1);
		            
		            setVersionReq.onsuccess = function(e) {
		                createObjStore(db);
		                e.target.transaction.oncomplete = function() {
			                getItems();
          				};
		            };
		         
		        } else { // Chrome >= 23
			        getItems();
		        }
		        
        	} else { // Firefox, IE10
	        	getItems();
        	}
        };
        
        req.onfailure = function(e) {
        	console.log(e);
        };
        
        // Newer browsers only - FF, Chrome (newer than ?), IE10
        req.onupgradeneeded = function(e) {
        	console.log('onupgradeneeded');
		    createObjStore(e.target.result);
		};
    }

	function createObjStore(db) {
	    db.createObjectStore('shop', {keyPath: 'id', autoIncrement: true});
    }
    
    function getItems() {
	    var transaction = db.transaction('shop', IDBTransaction.READ_ONLY);
        var objStore = transaction.objectStore('shop');
        console.log(objStore); 
        
        // Get everything in object store;
        var cursorReq = objStore.openCursor();
        
        var arr = [];
  
        cursorReq.onsuccess = function(e) {

        	var cursor = e.target.result;
    	
        	if(cursor) {
		        arr.push(cursor.value);
		        //console.log(cursor.value);
		        cursor.continue();
		    } else {
            	render(arr);
	        }
        }
        cursorReq.onerror = function(e) {
        	console.log(e);
        };
    }
    
    function render(items) {
    	var list = document.getElementById('shopList');
    	list.innerHTML = '';
    	
    	for (var i = 0; i < items.length; i++) {
			var li = document.createElement('li');
			var textNode = document.createTextNode(items[i].item);
			var x = document.createElement('a');
			x.textContent = '[x]';
			x.id = items[i].id;
			
			li.appendChild(textNode);
			li.appendChild(x);
			
			x.addEventListener('click', function(e) {
				var id = parseInt(e.target.id);
				deleteItem(id);
			}, false);

			list.appendChild(li);
	    }
    }
    

    function addItem() {
    	var input = document.getElementById('shopInput');
    	if(input.value == '') return;
    	
		data.item = input.value;
		data.created = new Date();
		input.select();
			
	    var transaction = db.transaction('shop', IDBTransaction.READ_WRITE);	    
        var objStore = transaction.objectStore('shop');      
        var req = objStore.put(data);
               
        req.onsuccess = function(e) {
        	getItems();
        };
        req.onfailure = function(e) {
        	console.log(e);
        };
    }
    
    function deleteItem(id) {
	    var transaction = db.transaction('shop', IDBTransaction.READ_WRITE);
        var objStore = transaction.objectStore('shop');
      
        var req = objStore.delete(id);
      
        req.onsuccess = function(e) {
        	console.log('Deleted ID = '+id);
        	getItems();
        };
        req.onerror = function(e) {
        	console.log('Error deleting: ', e);
        };
        req.onblocked = function(e){		
			console.log('Deleting DB Blocked: ', e);
		};
    }
    
    init();

})();