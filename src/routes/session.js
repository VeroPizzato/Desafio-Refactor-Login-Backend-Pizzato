const { Router } = require('express')
const User = require('../dao/models/user')
const { hashPassword, isValidPassword } = require('../utils/hashing')

const router = Router()

router.post('/login', async (req, res) => {
    const { email, password } = req.body

    if (email === "adminCoder@coder.com" && password === "adminCod3r123") {
        // Datos de sesión para el usuario coder Admin
        req.session.user = {
            first_name: "Usuario",
            last_name: "de CODER",
            rol: "admin"
        };
        return res.redirect('/products');
    }

    // 1. verificar que el usuario exista en la BD
    const user = await User.findOne({ email })  
    if (!user) {
        return res.status(401).send('User not found!')
    }  

    // 2. validar su password
      if (!isValidPassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid password!' })
    }

    // 3. crear nueva sesión si el usuario existe    
    req.session.user = { first_name: user.first_name, last_name: user.last_name, rol: user.rol }   
    res.redirect('/products')
})

router.get('/logout', (req, res) => {
    req.session.destroy(_ => {
        res.redirect('/')
    })
})

router.post('/register', async (req, res) => {
    const { first_name, last_name, email, age, password, rol } = req.body

    try {
        const user = await User.create({
            first_name,
            last_name,
            age: +age,
            email,
            password: hashPassword(password),
            rol
        })
        
        res.redirect('/login')
    }
    catch (err) {
        console.log(err)
        res.status(400).send('Error creating user!')
    }
})

module.exports = router