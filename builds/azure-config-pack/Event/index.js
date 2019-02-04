module.exports = async function (context, event) {
     var timeStamp = new Date().toISOString();
 
      if(event.isPastDue)
     {
         context.log('JavaScript is running late!');
     }
     context.log('JavaScript timer trigger function ran!', timeStamp);
 }; 