using FluentValidation;
using NexusFinance.API.Models.Entities;
using System.Linq;

namespace NexusFinance.API.Models.Validators
{
    public class CategoriaValidator : AbstractValidator<Categoria>
    {
        public CategoriaValidator()
        {
            RuleFor(x => x.NombreCategoria)
                .NotEmpty().WithMessage("El nombre de la categoría es obligatorio.")
                .MaximumLength(100).WithMessage("El nombre no puede superar los 100 caracteres.");

            RuleFor(x => x.TipoCategoria)
                .NotEmpty().WithMessage("El tipo de categoría es obligatorio.")
                .MaximumLength(20).WithMessage("El tipo no puede superar los 20 caracteres.")
                .Must(tipo => Categoria.TiposPermitidos.Contains(tipo.ToLower()))
                .WithMessage("El tipo de categoría debe ser: ingreso, gasto, transferencia, inversion, ahorro, credito o deuda.");

            RuleFor(x => x.Color)
                .MaximumLength(7).WithMessage("El color no puede superar los 7 caracteres.");

            RuleFor(x => x.Icono)
                .MaximumLength(50).WithMessage("El icono no puede superar los 50 caracteres.");
        }
    }
} 