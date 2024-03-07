const mongoose = require('mongoose');
const Application = require('../models/Application');


(async () => {
  await mongoose.connect('mongodb+srv://shivam19272:Admin123@irb-dbcluster.ifxrdm9.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  // Update all documents to add the new "email" field
  const result = await Application.updateMany({}, { $set: { "approved": false }});
  
  await mongoose.connection.close();
})();