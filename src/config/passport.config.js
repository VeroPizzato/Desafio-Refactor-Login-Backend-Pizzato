const passport = require('passport')
const { Strategy } = require('passport-local')
const User = require('../dao/models/user')
const { hashPassword, isValidPassword } = require('../utils/hashing')

const initializeStrategy = () => {

    // estrategia para el registro de usuarios
    passport.use('register', new Strategy({
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
            done(null, { first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.rol });
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

    passport.use('login', new Strategy({
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