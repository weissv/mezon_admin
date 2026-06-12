import { Router } from 'express';
import { checkRole } from '../middleware/checkRole';
import IngredientController from '../controllers/IngredientController';

const router = Router();

// GET /api/ingredients/search
router.get('/search', checkRole(['ADMIN', 'ZAVHOZ', 'DIRECTOR']), IngredientController.searchExternal.bind(IngredientController));

// POST /api/ingredients
router.post('/', checkRole(['ADMIN', 'ZAVHOZ']), IngredientController.createHybrid.bind(IngredientController));

export default router;
