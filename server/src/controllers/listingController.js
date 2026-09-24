import { Listing } from '../models/Listing.js';
import Joi from 'joi';

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(0).max(1000),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
})
 
const updateSchema = Joi.object({
  title: Joi.string().min(2).max(100),
  description: Joi.string().min(0).max(1000),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)

})

function publicUser(u) {
  return { id: u._id.toString(), 
          title: u.title, 
          description: u.description, 
          price: u.price,
          category: u.category,
          condition: u.condition,
          status: u.status,
          seller: formatSeller(u.seller),
          createdAt: u.createdAt };
}
function formatSeller(s) {
  if (!s) return null;
  if (s.name === undefined) return { id: s.toString() }; // not populated, just an id
  return { id: s._id.toString(), name: s.name, email: s.email };
}
// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
      const listings = await Listing.find({ status: { $ne: 'removed' } }).populate('seller', 'name email').sort({ createdAt: -1 }).lean();
      res.json({ listings: listings.map(publicUser) });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
        const listing = await Listing.findOne({ _id: req.params.id, status: { $ne: 'removed' } }).populate('seller', 'name email').lean();
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.json({ listing: publicUser(listing) });
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
        const { value, error } = createSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.message });
    
        const listing = await Listing.create({ title: value.title, description: value.description, price: value.price, category: value.category, condition: value.condition, status: value.status, seller: value.seller });
        res.status(201).json({ listing: publicUser(listing) });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing: publicUser(listing) });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if(listing.status === 'removed') return res.status(400).json({ message: 'Listing already removed' });
    listing.status = 'removed';
    await listing.save();
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) { next(err); }
}

export async function markAsSold(req, res, next) {
   
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status === 'sold') return res.status(400).json({ message: 'Listing already sold' });
    listing.status = 'sold';
    await listing.save();
    res.json({ listing: publicUser(listing) });
}
