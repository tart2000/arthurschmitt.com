import './core/env.core.js'
import app from './core/app.core.js'
import { getLambdaHandlerFactory } from './services/lambdaHandler.service.ts'

export const handler = getLambdaHandlerFactory()(app)
