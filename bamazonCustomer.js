var inquirer = require('inquirer');
var columnify = require('columnify');
var mySql = require("mysql");
var cnx = mySql.createConnection ({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "790@Camaro",
	database: "bamazonDB"
});

cnx.connect(function(err) {
	if(err) throw err
	selectAllProducts();	
});

var products = [];
function Product(itemid,productname,productsales,departmentname,price,stockqty) {
  this.item_id = itemid;
  this.product_name = productname;
  this.product_sales = productsales;
  this.department_name = departmentname;
  this.price = price;
  this.stock_qty = stockqty;
};

function selectAllProducts() {
	cnx.query("Select * from products", function(err,res) {
		if(err) throw err;
		for (var i in res) {
			var product = new Product(res[i].item_id, res[i].product_name, res[i].product_sales, res[i].department_name, res[i].price, res[i].stock_qty);
			products.push(product);
		};
		var columns = columnify(products);
		console.log(columns);
		products = [];
		productTransaction();
	});
};

function updateProducts(item,count) {
    //********************************************************/
    // First get item data:                                   /
    //     1) to determine if enough qty is present to purchase /
    //   2) reduce qty and increase sales if qty present      /
    //********************************************************/
    cnx.query("Select product_sales, price, stock_qty from products where ?",{ item_id:item}, function(err,res) {
        //**********************************************************/
        // Check if stock_qty in database is higher than user entry /
        //**********************************************************/
        if (res[0].stock_qty >= count) {
            //***********************************************************/
            // Calculate product_sales and add to current database total /
            // Reduce stock_qty by User entry                            /
            //***********************************************************/
            var productSales = (count * res[0].price);
            var newproductSales = (res[0].product_sales + productSales);
            var newitemCount = res[0].stock_qty - count
            cnx.query("Update products set product_sales = ?, stock_qty = ? where item_id = ?",[newproductSales,newitemCount,item], function(err,res) {
                if(err) throw err;
                console.log("Successfully purchased " + count + " products!");
                selectAllProducts();
            });
        } else {
            console.log("Insufficient count!");
            selectAllProducts();
        };
    });
};

function productTransaction () {
	inquirer.prompt([
	    {
	    	name: "item",
	        message: "What is the id of the item you would like to purchase? [Quit with Q]",
	        validate: function( value ) {
	        	if (value >= 0 && value <= 10) {
          			return true;
	        	} else if (value == "Q") {
	        		cnx.end();
        			process.exit();
        		} else {
          			return 'Please enter a valid item_id!';
        		}
        	}
	    }, 
	    {
	   		name: "qty",
	    	message: "How many would you like?",
	    	validate: function( value ) {
	        	if (isNaN(value)) {
	        		return 'Please enter a valid item_id!';
	        	} else {
        			return true;
        		}
        	}
	  	}
	]).then(function(answers) {
	    var answer = answers.toUpperCase
		var item = answers.item;
		var count = answers.qty;
		updateProducts(item,count);
	});	
};