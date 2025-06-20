"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentCommands = void 0;
const discord_js_1 = require("discord.js");
const index_1 = require("@modules/payment/index");
const embed_1 = require("@utils/embed");
const permissions_1 = require("@utils/permissions");
const validation_1 = require("@utils/validation");
const features_1 = require("../config/features");
exports.paymentCommands = [
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('invoice')
            .setDescription('Invoice management commands')
            .addSubcommand(subcommand => subcommand
            .setName('create')
            .setDescription('Create a new invoice')
            .addStringOption(option => option
            .setName('customer-id')
            .setDescription('Customer ID from ticket')
            .setRequired(true))
            .addStringOption(option => option
            .setName('product')
            .setDescription('Product or service name')
            .setRequired(true))
            .addIntegerOption(option => option
            .setName('amount')
            .setDescription('Amount in VND')
            .setRequired(true)
            .setMinValue(1000)
            .setMaxValue(100000000))
            .addBooleanOption(option => option
            .setName('is-deposit')
            .setDescription('Is this a deposit payment?')
            .setRequired(false))
            .addIntegerOption(option => option
            .setName('deposit-amount')
            .setDescription('Deposit amount in VND (if deposit)')
            .setRequired(false)
            .setMinValue(1000))
            .addStringOption(option => option
            .setName('ticket-id')
            .setDescription('Related ticket ID')
            .setRequired(false)))
            .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('View invoice details')
            .addStringOption(option => option
            .setName('invoice-id')
            .setDescription('Invoice ID to view')
            .setRequired(true))),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('paymentSystem')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The payment system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const paymentManager = new index_1.PaymentManager(bot);
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'create':
                    await handleInvoiceCreate(interaction, paymentManager);
                    break;
                case 'view':
                    await handleInvoiceView(interaction, paymentManager);
                    break;
            }
        }
    },
    {
        data: new discord_js_1.SlashCommandBuilder()
            .setName('refund')
            .setDescription('Refund management commands')
            .addSubcommand(subcommand => subcommand
            .setName('request')
            .setDescription('Request a refund')
            .addStringOption(option => option
            .setName('invoice-id')
            .setDescription('Invoice ID to refund')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for refund')
            .setRequired(true)))
            .addSubcommand(subcommand => subcommand
            .setName('approve')
            .setDescription('Approve a refund request (Staff only)')
            .addStringOption(option => option
            .setName('invoice-id')
            .setDescription('Invoice ID to approve refund for')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for approval')
            .setRequired(false)))
            .addSubcommand(subcommand => subcommand
            .setName('deny')
            .setDescription('Deny a refund request (Staff only)')
            .addStringOption(option => option
            .setName('invoice-id')
            .setDescription('Invoice ID to deny refund for')
            .setRequired(true))
            .addStringOption(option => option
            .setName('reason')
            .setDescription('Reason for denial')
            .setRequired(true))),
        async execute(interaction, bot) {
            if (!features_1.FeatureManager.isEnabled('paymentSystem')) {
                const disabledEmbed = embed_1.EmbedManager.createErrorEmbed('Feature Disabled', 'The payment system is currently disabled.');
                await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
                return;
            }
            const paymentManager = new index_1.PaymentManager(bot);
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'request':
                    await handleRefundRequest(interaction, paymentManager);
                    break;
                case 'approve':
                    await handleRefundApprove(interaction, paymentManager);
                    break;
                case 'deny':
                    await handleRefundDeny(interaction, paymentManager);
                    break;
            }
        }
    }
];
async function handleInvoiceCreate(interaction, paymentManager) {
    try {
        if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can create invoices.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const customerId = interaction.options.getString('customer-id', true);
        const productName = interaction.options.getString('product', true);
        const amount = interaction.options.getInteger('amount', true);
        const isDeposit = interaction.options.getBoolean('is-deposit') || false;
        const depositAmount = interaction.options.getInteger('deposit-amount');
        const ticketId = interaction.options.getString('ticket-id');
        if (!validation_1.ValidationManager.isValidCustomerId(customerId)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Invalid Customer ID', 'Please provide a valid customer ID (format: CUST-XXXX).');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        if (isDeposit && (!depositAmount || depositAmount >= amount)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Invalid Deposit', 'Deposit amount must be less than the total amount.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const invoice = await paymentManager.createInvoice(interaction.user.id, customerId, productName, amount, isDeposit, depositAmount || undefined, ticketId || undefined);
        if (invoice) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Invoice Created', `Invoice ${invoice.invoiceId} has been created and sent to the customer.`);
            successEmbed.addFields({ name: 'Product', value: productName, inline: true }, { name: 'Amount', value: validation_1.ValidationManager.formatCurrency(amount), inline: true }, { name: 'Type', value: isDeposit ? 'Deposit' : 'Full Payment', inline: true });
            await interaction.editReply({ embeds: [successEmbed] });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Creation Failed', 'Failed to create the invoice. Please try again.');
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
    catch (error) {
        console.error('Error creating invoice:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while creating the invoice.');
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
async function handleInvoiceView(interaction, paymentManager) {
    try {
        const invoiceId = interaction.options.getString('invoice-id', true);
        const invoice = await paymentManager.getInvoiceStatus(invoiceId);
        if (!invoice) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Invoice Not Found', 'No invoice found with the provided ID.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const isStaff = permissions_1.PermissionManager.isStaff(interaction.member);
        const isCustomer = invoice.customerId === interaction.user.id;
        if (!isStaff && !isCustomer) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'You can only view your own invoices.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const finalAmount = invoice.isDeposit && invoice.depositAmount
            ? invoice.depositAmount
            : invoice.amount;
        const invoiceEmbed = embed_1.EmbedManager.createPaymentEmbed(invoice.invoiceId, finalAmount, invoice.productName);
        invoiceEmbed.addFields({ name: 'Status', value: invoice.status.toUpperCase(), inline: true }, { name: 'Payment Type', value: invoice.isDeposit ? 'Deposit' : 'Full Payment', inline: true }, { name: 'Created', value: `<t:${Math.floor(invoice.createdAt.getTime() / 1000)}:F>`, inline: true });
        if (invoice.isDeposit && invoice.depositAmount) {
            const remainingAmount = invoice.amount - invoice.depositAmount;
            invoiceEmbed.addFields({
                name: 'Remaining Balance',
                value: validation_1.ValidationManager.formatCurrency(remainingAmount),
                inline: true
            });
        }
        if (invoice.expiresAt && invoice.status === 'pending') {
            invoiceEmbed.addFields({
                name: 'Expires',
                value: `<t:${Math.floor(invoice.expiresAt.getTime() / 1000)}:R>`,
                inline: true
            });
        }
        await interaction.reply({ embeds: [invoiceEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Error viewing invoice:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while retrieving the invoice.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleRefundRequest(interaction, paymentManager) {
    try {
        const invoiceId = interaction.options.getString('invoice-id', true);
        const reason = interaction.options.getString('reason', true);
        const success = await paymentManager.requestRefund(invoiceId, interaction.user.id, reason);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Refund Requested', `Your refund request for invoice ${invoiceId} has been submitted for review.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Request Failed', 'Failed to submit refund request. Please check the invoice ID or try again later.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error requesting refund:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while requesting the refund.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleRefundApprove(interaction, paymentManager) {
    try {
        if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can approve refunds.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const invoiceId = interaction.options.getString('invoice-id', true);
        const reason = interaction.options.getString('reason') || 'Approved by staff';
        const success = await paymentManager.processRefund(invoiceId, interaction.user.id, true, reason);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Refund Approved', `Refund for invoice ${invoiceId} has been approved and processed.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Approval Failed', 'Failed to approve the refund. Please check the invoice ID.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error approving refund:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while approving the refund.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
async function handleRefundDeny(interaction, paymentManager) {
    try {
        if (!permissions_1.PermissionManager.isStaff(interaction.member)) {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Permission Denied', 'Only staff members can deny refunds.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }
        const invoiceId = interaction.options.getString('invoice-id', true);
        const reason = interaction.options.getString('reason', true);
        const success = await paymentManager.processRefund(invoiceId, interaction.user.id, false, reason);
        if (success) {
            const successEmbed = embed_1.EmbedManager.createSuccessEmbed('Refund Denied', `Refund for invoice ${invoiceId} has been denied.`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });
        }
        else {
            const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Denial Failed', 'Failed to deny the refund. Please check the invoice ID.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error denying refund:', error);
        const errorEmbed = embed_1.EmbedManager.createErrorEmbed('Error', 'An error occurred while denying the refund.');
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
}
//# sourceMappingURL=payment.js.map