const passport = require('passport')
const localStrategy = require('passport-local')
const githubStrategy  = require('passport-github2')
const User = require('../dao/models/user')
const { hashPassword, isValidPassword } = require('../utils/hashing')
const { clientID, clientSecret, callbackURL } = require('./github.private')

const LocalStrategy = localStrategy.Strategy
const GithubStrategy = githubStrategy.Strategy

const initializeStrategy = () => {
    passport.use('github', new GithubStrategy({
        clientID,
        clientSecret,
        callbackURL
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            console.log('Profile de github: ', profile, profile._json)            

            const user = await User.findOne({ email: profile._json.email })
                     
            if (user) {            
                return done(null, user)
            }

            // crear el usuario, ya que no existe
            const fullName = profile._json.name
            const first_name = fullName.substring(0, fullName.lastIndexOf(' '))
            const last_name = fullName.substring(fullName.lastIndexOf(' ') + 1)
            
            const newUser = {
                first_name,
                last_name,
                age: 47,
                email: profile._json.email,
                password: ''
            }                        

            const result = await User.create(newUser)
            return done(null, result)
        
        }
        catch (err) {
            done(err)
        }
    }))    

    // estrategia para el registro de usuarios
    passport.use('register', new LocalStrategy({
        passReqToCallback: true, // habilitar el parámetro "req" en el callback de abajo
        usernameField: 'email'
    }, async (req, username, password, done) => {

        const { first_name, last_name, age, email, rol } = req.body

        try {
            const user = await User.findOne({ email: username })
            if (user) {
                console.log('User already exists!')

                // null como 1er argumento, ya que no hubo error
                // false en el 2do argumento, indicando que no se pudo registrar
                return done(null, false)
            }

            const newUser = {
                first_name,
                last_name,
                age: +age,
                email,
                password: hashPassword(password),
                rol
            }
            const result = await User.create(newUser)

            // registro exitoso
            return done(null, result)
        }
        catch (err) {
            return done('Error al obtener el usuario: ' + err)
        }
    }))

    // al registrar o hacer login del usuario, pasamos el modelo de user al callback done
    // passport necesita serializar este modelo, para guardar una referencia al usuario en la sesión
    // simplemente podemos usar su id
    passport.serializeUser((user, done) => {
        console.log('serialized!', user)
        if (user.email === "adminCoder@coder.com") {
            // Serialización especial para el usuario 'adminCoder@coder.com'
            done(null, { first_name: user.first_name, last_name: user.last_name, age: user.age, email: user.email, role: user.rol });
        } else {
            done(null, user._id)
        }
    })

    // para restaurar al usuario desde la sesión, passport utiliza el valor serializado y vuelve a generar al user
    // el cual colocará en req.user para que nosotros podamos usar
    passport.deserializeUser(async (id, done) => {
        console.log('deserialized!', id)
        if (id.email === 'adminCoder@coder.com') {
            // Deserialización especial para el usuario 'adminCoder@coder.com'
            done(null, id);
        } else {
            const user = await User.findById(id);
            done(null, user);
        }        
    })

    passport.use('login', new LocalStrategy({
        usernameField: 'email'
    }, async (username, password, done) => {
        try {           
            if (!username || !password) {
                return done(null, false)
            }

            let user = await User.findOne({ email: username });
            if (username === "adminCoder@coder.com" && password === "adminCod3r123") {
                // Datos de sesión para el usuario coder Admin
                user = {                    
                    first_name: "Usuario",
                    last_name: "de CODER", 
                    age: 21,
                    email: "adminCoder@coder.com",                      
                    rol: "admin"
                };
                return done(null, user);
            }

            // 1. verificar que el usuario exista en la BD           
            if (!user) {
                console.log("User doesn't exist")
                return done(null, false);
            }

            // 2. validar su password
            if (!isValidPassword(password, user.password)) {
                return done(null, false);
            }

            return done(null, user);            
        }
        catch (err) {
            done(err)
        }
    }))
}

module.exports = initializeStrategy