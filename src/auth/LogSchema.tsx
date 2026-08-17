
import { z } from "zod";

/**
 * Schema exclusivo para o formulário de Login
 */
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, {
            message: "O e-mail é obrigatório.",
        })
        .email({
            message: "Digite um e-mail válido (ex: usuario@email.com).",
        })
        .max(100, {
            message: "O e-mail é muito longo.",
        }),

    password: z
        .string()
        .min(1, {
            message: "A senha é obrigatória.",
        })
        .min(6, {
            message: "A senha deve ter no mínimo 6 caracteres.",
        }),
});

export type LoginInput = z.infer<typeof loginSchema>;


/**
 * Schema exclusivo para o formulário de Cadastro
 */
export const registerSchema = z
    .object({
        email: z
            .string()
            .trim()
            .min(1, {
                message: "O e-mail é obrigatório.",
            })
            .email({
                message: "Digite um e-mail válido (ex: usuario@email.com).",
            })
            .max(100, {
                message: "O e-mail é muito longo.",
            }),

        password: z
            .string()
            .min(1, {
                message: "A senha é obrigatória.",
            })
            .min(6, {
                message: "A senha deve ter no mínimo 6 caracteres.",
            })
            .max(128, {
                message: "A senha não pode ter mais de 128 caracteres.",
            }),

        confirmPassword: z
            .string()
            .min(1, {
                message: "Confirme sua senha.",
            }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "As senhas não coincidem.",
    });

export type RegisterInput = z.infer<typeof registerSchema>;


/**
 * Schema de validação do formulário de entrada de tempo
 */
export const usageLogSchema = z.object({
    email: z
        .string()
        .email({
            message: "Digite um e-mail válido.",
        })
        .max(100, {
            message: "E-mail muito longo.",
        }),

    appName: z
        .string()
        .min(1, {
            message: "Selecione ou digite o nome do APP.",
        })
        .max(50, {
            message: "Nome do APP informado é inválido.",
        }),

    minutesSpent: z.coerce
        .number({
            message: "Insira um número válido.",
        })
        .min(0, {
            message: "O tempo não pode ser negativo.",
        })
        .max(1440, {
            message: "O tempo máximo em um dia é de 1440 minutos (24h).",
        }),
});

export type UsageLogInput = z.infer<typeof usageLogSchema>;

