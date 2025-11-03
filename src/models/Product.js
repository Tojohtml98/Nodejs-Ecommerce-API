import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 500
    },
    code: {
        type: String,
        required: true,
        unique: true,
        minlength: 1,
        maxlength: 20
    },
    price: {
        type: Number,
        required: true,
        min: 0.01
    },
    status: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    category: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 50
    },
    thumbnails: {
        type: [String],
        default: []
    }
}, {
    timestamps: true // Agregar createdAt y updatedAt automáticamente
});

// Agregar plugin de paginación
productSchema.plugin(mongoosePaginate);

const Product = mongoose.model('Product', productSchema);

export default Product;

