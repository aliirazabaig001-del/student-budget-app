enum TxType { income, expense }

class AppTransaction {
  final String id;
  final TxType type;
  final double amount;
  final String category; // source (income) or category (expense)
  final DateTime date;
  final String paymentMethod;
  final String note;

  AppTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.category,
    required this.date,
    required this.paymentMethod,
    this.note = '',
  });
}

class CategoryBudget {
  final String category;
  double limit;
  double get spent => 0; // computed live from transactions in AppState

  CategoryBudget({required this.category, required this.limit});
}

class SavingGoal {
  final String id;
  final String name;
  final double targetAmount;
  double currentAmount;
  final DateTime targetDate;

  SavingGoal({
    required this.id,
    required this.name,
    required this.targetAmount,
    required this.currentAmount,
    required this.targetDate,
  });

  double get progress => targetAmount == 0 ? 0 : (currentAmount / targetAmount).clamp(0.0, 1.0).toDouble();
}

class Bill {
  final String id;
  final String name;
  final double amount;
  final DateTime dueDate;
  bool reminderEnabled;

  Bill({
    required this.id,
    required this.name,
    required this.amount,
    required this.dueDate,
    this.reminderEnabled = true,
  });
}
