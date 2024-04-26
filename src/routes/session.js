const { Router } = require('express')
const User = require('../dao/models/user')
const { hashPassword } = require('../utils/hashing')
const passport = require('passport')

const router = Router()

// agregamos el middleware de passport para el login
router.post('/login', passport.authenticate('login', { failureRedirect: '/api/sessions/faillogin' }), async (req, res) => {
    // const { email, password } = req.body
    // if (!email || !password) {
    //     return res.status(400).send('Invalid credentials!')
    // }

    // if (email === "adminCoder@coder.com" && password === "adminCod3r123") {
    //     // Datos de sesión para el usuario coder Admin
    //     req.session.user = {
    //         first_name: "Usuario",
    //         last_name: "de CODER",
    //         rol: "admin"
    //     };
    //     return res.redirect('/products');
    // }

    // // 1. verificar que el usuario exista en la BD
    // const user = await User.findOne({ email })  
    // if (!user) {
    //     return res.status(401).send('User not found!')
    // }  

    // // 2. validar su password
    //   if (!isValidPassword(password, user.password)) {
    //     return res.status(401).json({ error: 'Invalid password!' })
    // }

    // crear nueva sesión si el usuario existe    
    req.session.user = { first_name: req.user.first_name, last_name:req.user.last_name, rol: req.user.rol }   
    res.redirect('/products')
})

router.get('/faillogin', (req, res) => {
    res.send({ status: 'error', message: 'Login failed!' })
})

router.get('/logout', (req, res) => {
    req.session.destroy(_ => {
        res.redirect('/')
    })
})

// agregamos el middleware de passport para el register
router.post('/register', passport.authenticate('register', { failureRedirect: '/api/sessions/failregister' }), async (req, res) => {
    // const { first_name, last_name, email, age, password, rol } = req.body

    // try {
    //     const user = await User.create({
    //         first_name,
    //         last_name,
    //         age: +age,
    //         email,
    //         password: hashPassword(password),
    //         rol
    //     })
        
    //     res.redirect('/login')
    // }
    // catch (err) {
    //     console.log(err)
    //     res.status(400).send('Error creating user!')
    // }

    console.log(req.body)
    // no es necesario registrar el usuario aquí, ya lo hacemos en la estrategia!
    res.redirect('/login')
})

router.get('/failregister', (req, res) => {
    res.send({ status: 'error', message: 'Register failed!' })
})

router.post('/reset_password', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).send('Invalid credentials!')
    }
    
    // 1. verificar que el usuario exista en la BD
    const user = await User.findOne({ email })  
    if (!user) {
        return res.status(401).send('User not found!')
    }  

    // actualizar la nueva contraseña
    await User.updateOne({ email}, { $set: { password: hashPassword(password) } })

    res.redirect('/login')
})

module.exports = router