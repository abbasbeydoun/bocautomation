let fs = require('fs');
try{
    console.log(fs.readFileSync("FakeDir"))
}
catch(err){
    console.log("We got err", err)
}