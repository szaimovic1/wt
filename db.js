const Sequelize = require("sequelize");
const sequelize = new Sequelize("DBWT19","root","root",{host:"127.0.0.1",dialect:"mysql",logging:false});
const db={};

db.Sequelize = Sequelize;  
db.sequelize = sequelize;

//import modela
db.osoblje = sequelize.import(__dirname+'/osoblje.js');
db.rezervacija = sequelize.import(__dirname+'/rezervacija.js');
db.termin = sequelize.import(__dirname+'/termin.js');
db.sala = sequelize.import(__dirname+'/sala.js');

//relacije
db.osoblje.hasMany(db.rezervacija, {as: "osobaN", foreignKey: {name: "osoba", type:Sequelize.INTEGER}});
db.rezervacija.belongsTo(db.osoblje, {as: "osobaN", foreignKey: {name: "osoba", type:Sequelize.INTEGER}});

db.termin.hasOne(db.rezervacija, {as: "terminN", foreignKey: {name: "termin", type:Sequelize.INTEGER, unique: true}});
db.rezervacija.belongsTo(db.termin, {as: "terminN", foreignKey: {name: "termin", type:Sequelize.INTEGER, unique: true}});

db.sala.hasMany(db.rezervacija, {as: "salaN", foreignKey: {name: "sala", type:Sequelize.INTEGER}});
db.rezervacija.belongsTo(db.sala, {as: "salaN", foreignKey: {name: "sala", type:Sequelize.INTEGER}});

db.osoblje.hasOne(db.sala, {as: "zaduzenaOsobaN", foreignKey: {name: "zaduzenaOsoba", type:Sequelize.INTEGER}});
db.sala.belongsTo(db.osoblje, {as: "zaduzenaOsobaN", foreignKey: {name: "zaduzenaOsoba", type:Sequelize.INTEGER}});

module.exports=db;