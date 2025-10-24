import { Request, Response } from 'express';
import supportService from '../services/supportService';

export const createSupportTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { category, subject, description, priority } = req.body;

    if (!category || !subject || !description) {
      res.status(400).json({
        success: false,
        message: 'Category, subject, and description are required',
      });
      return;
    }

    const ticket = await supportService.createSupportTicket(userId, {
      category,
      subject,
      description,
      priority
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket },
    });
  } catch (error: any) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create support ticket: ${error.message}`,
    });
  }
};

export const getUserTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { limit = 20, offset = 0 } = req.query;

    const { tickets, total } = await supportService.getTickets({
      assignedTo: userId,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total,
        },
      },
    });
  } catch (error: any) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get user tickets: ${error.message}`,
    });
  }
};

export const getTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const userId = (req as any).user?.userId;

    const ticket = await supportService.getTicketWithConversation(ticketId);

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
      return;
    }

    // Check if user owns the ticket or is admin
    if (ticket.userId !== userId && !(req as any).user.isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: { ticket },
    });
  } catch (error: any) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get ticket: ${error.message}`,
    });
  }
};

export const addUserMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;
    const userId = (req as any).user?.userId;
    const { message, attachments } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        message: 'Message is required',
      });
      return;
    }

    const ticketMessage = await supportService.addTicketMessage(
      ticketId,
      userId,
      'user',
      message,
      'text',
      false,
      attachments
    );

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { message: ticketMessage },
    });
  } catch (error: any) {
    console.error('Add user message error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to send message: ${error.message}`,
    });
  }
};