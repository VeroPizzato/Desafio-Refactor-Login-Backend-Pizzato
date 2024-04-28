const { Router } = require('express')
const User = require('../dao/models/user')
const { hashPassword } = require('../utils/hashing')
const passport = require('passport')

const router = Router()

// agregamos el middleware de passport para el login
router.post('/login', passport.authenticate('login', { failureRedirect: '/api/sessions/faillogin' }), async (req, res) => {
    if (!req.user) return res.status(400).send('Invalid credentials!')
    // crear nueva sesión si el usuario existe   
    req.session.user = { first_name: req.user.first_name, last_name: req.user.last_name, age: req.user.age, email: req.user.email, rol: req.user.rol }   
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

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }), (req, res) => { })

router.get('/githubcallback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
    req.session.user = req.user
    res.redirect('/products')
})

module.exports = router