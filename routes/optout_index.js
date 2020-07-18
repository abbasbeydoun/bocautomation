var express = require('express');
var router = express.Router();
let optOut = require('./opt-out');

/* GET optout page. */
router.get('/', (req, res) => {
  res.send('index');
});


router.get('/acxiom',  async (req, res) => {
    try {
        await optOut.acxiom_optout({'last_name': 'Beydoun'});
        res.send("Ok")
    }
    catch(err){
        res.send(JSON.stringify(err))
    }

});


// beenverified optout
router.get('/beenverified', async (req, res) => {
  // req will have the necessary fields. We will hard code them for now
  try {
    let result = await optOut.beenVerifiedOptOut(req);
    res.send({status:200, message: JSON.stringify(result)})
  }
  catch(err) {
    res.send({status:500, message: "Internal server error"})
  }

});


module.exports = router;
