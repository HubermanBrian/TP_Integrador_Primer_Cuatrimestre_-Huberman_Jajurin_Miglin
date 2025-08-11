import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Users, Star, ArrowRight, Play, Shield, Zap } from 'lucide-react'
import apiService from '../services/api'

const LandingPage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        const events = await apiService.getEvents({ limit: 3 });
        setUpcomingEvents(events);
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        // Fallback to empty array if API fails
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  const features = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "EvenTroca",
      description: "Descubre eventos increíbles en tu ciudad y más allá"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "EvenTroca",
      description: "Los mejores lugares para tus eventos favoritos"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "EvenTroca",
      description: "Conecta con personas que comparten tus intereses"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "EvenTroca",
      description: "Crea recuerdos inolvidables en cada evento"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary">EvenTroca</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link to="/login" className="btn-secondary">
                Iniciar Sesión
              </Link>
              <Link to="/signup" className="btn-primary">
                Registrarse
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-secondary mb-6"
            >
              Descubre Eventos
              <span className="text-primary block">Increíbles</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Encuentra, participa y crea los mejores eventos en tu ciudad. 
              Conecta con personas que comparten tus pasiones.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/signup" className="btn-primary text-lg px-8 py-4">
                Comenzar Ahora
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <button className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
                <Play className="w-5 h-5" />
                <span>Ver Demo</span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16 scroll-animate"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-secondary mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ofrecemos la mejor experiencia para descubrir y participar en eventos únicos
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-2 scroll-animate"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16 scroll-animate"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-secondary mb-4">
              Próximos Eventos
            </h2>
            <p className="text-xl text-gray-600">
              No te pierdas estos eventos increíbles
            </p>
          </motion.div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando eventos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-12">
                  No hay eventos próximos disponibles.
                </div>
              ) : (
                upcomingEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 scroll-animate"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={event.Img_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'} 
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                      <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                        {event.price === 0 ? 'Gratis' : `$${event.price}`}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-secondary mb-2">
                        {event.name}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(event.start_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location_name}
                      </div>
                      <Link to={`/evento/${event.id}`} className="btn-primary w-full">
                        Ver Detalles
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="scroll-animate"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              ¿Listo para comenzar?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Únete a miles de personas que ya están descubriendo eventos increíbles
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Crear Cuenta Gratis
              </Link>
              <Link to="/login" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors">
                Ya tengo cuenta
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">EvenTroca</span>
              </div>
              <p className="text-gray-300">
                La mejor plataforma para descubrir y participar en eventos únicos.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Eventos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ubicaciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Organizadores</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 EvenTroca. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 