import 'package:flutter/foundation.dart';
import 'models.dart';
import 'widgets/common_widgets.dart' show setDisplayCurrency;

/// Single source of truth for the app's in-memory data.
/// A real build would swap this for a backend/local database, but the
/// shape (transactions, budgets, goals, bills) mirrors the report and
/// the Figma prototype exactly, so the UI layer never has to change.
class AppState extends ChangeNotifier {
  String userName = 'Alex';
  String currency = 'USD';
  bool weeklySummaryEnabled = true;
  bool budgetAlertsEnabled = true;

  double monthlyBudget = 2000;

  final Map<String, double> categoryBudgets = {
    'Rent': 800,
    'Food': 400,
    'Transport': 200,
    'Education': 250,
    'Entertainment': 150,
  };

  final List<AppTransaction> transactions = [
    AppTransaction(
      id: 't1',
      type: TxType.income,
      amount: 1500,
      category: 'Salary',
      date: DateTime.now(),
      paymentMethod: 'Bank transfer',
    ),
    AppTransaction(
      id: 't2',
      type: TxType.expense,
      amount: 750,
      category: 'Rent',
      date: DateTime.now(),
      paymentMethod: 'Bank transfer',
    ),
    AppTransaction(
      id: 't3',
      type: TxType.expense,
      amount: 82,
      category: 'Food',
      date: DateTime.now(),
      paymentMethod: 'Debit card',
    ),
    AppTransaction(
      id: 't4',
      type: TxType.income,
      amount: 500,
      category: 'Family Support',
      date: DateTime.now(),
      paymentMethod: 'Bank transfer',
    ),
    AppTransaction(
      id: 't5',
      type: TxType.expense,
      amount: 35,
      category: 'Transport',
      date: DateTime.now(),
      paymentMethod: 'Debit card',
    ),
    AppTransaction(
      id: 't6',
      type: TxType.expense,
      amount: 120,
      category: 'Transport',
      date: DateTime.now().subtract(const Duration(days: 3)),
      paymentMethod: 'Cash',
    ),
    AppTransaction(
      id: 't7',
      type: TxType.expense,
      amount: 100,
      category: 'Education',
      date: DateTime.now().subtract(const Duration(days: 5)),
      paymentMethod: 'Debit card',
    ),
    AppTransaction(
      id: 't8',
      type: TxType.expense,
      amount: 100,
      category: 'Entertainment',
      date: DateTime.now().subtract(const Duration(days: 6)),
      paymentMethod: 'Debit card',
    ),
    AppTransaction(
      id: 't9',
      type: TxType.income,
      amount: 1200,
      category: 'Salary',
      date: DateTime.now().subtract(const Duration(days: 10)),
      paymentMethod: 'Bank transfer',
    ),
  ];

  final List<SavingGoal> savingGoals = [
    SavingGoal(
      id: 'g1',
      name: 'Emergency Fund',
      targetAmount: 1000,
      currentAmount: 350,
      targetDate: DateTime.now().add(const Duration(days: 120)),
    ),
  ];

  final List<Bill> bills = [
    Bill(
      id: 'b1',
      name: 'Phone Plan',
      amount: 40,
      dueDate: DateTime.now().add(const Duration(days: 4)),
    ),
    Bill(
      id: 'b2',
      name: 'Internet',
      amount: 55,
      dueDate: DateTime.now().add(const Duration(days: 9)),
    ),
  ];

  // ---- Derived / computed values ----

  Iterable<AppTransaction> get monthlyTransactions {
    final now = DateTime.now();
    return transactions.where((t) => t.date.year == now.year && t.date.month == now.month);
  }

  double get totalIncome => monthlyTransactions
      .where((t) => t.type == TxType.income)
      .fold(0, (sum, t) => sum + t.amount);

  double get totalExpenses => monthlyTransactions
      .where((t) => t.type == TxType.expense)
      .fold(0, (sum, t) => sum + t.amount);

  double get currentBalance => transactions.fold<double>(0, (sum, t) => sum + (t.type == TxType.income ? t.amount : -t.amount));

  double get budgetRemaining => monthlyBudget - totalExpenses;

  double spentInCategory(String category) => monthlyTransactions
      .where((t) => t.type == TxType.expense && t.category == category)
      .fold(0, (sum, t) => sum + t.amount);

  Map<String, double> get spendingByCategory {
    final map = <String, double>{};
    for (final t in monthlyTransactions.where((t) => t.type == TxType.expense)) {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    }
    return map;
  }

  List<AppTransaction> get recentTransactions {
    final list = [...transactions]..sort((a, b) => b.date.compareTo(a.date));
    return list.take(5).toList();
  }

  // ---- Mutations ----

  void addTransaction(AppTransaction tx) {
    transactions.add(tx);
    notifyListeners();
  }

  void updateMonthlyBudgets({
    required double total,
    required Map<String, double> categories,
  }) {
    monthlyBudget = total;
    categoryBudgets
      ..clear()
      ..addAll(categories);
    notifyListeners();
  }

  void addSavingGoal(SavingGoal goal) {
    savingGoals.add(goal);
    notifyListeners();
  }

  void updateSettings({
    String? currencyCode,
    bool? weeklySummary,
    bool? budgetAlerts,
  }) {
    if (currencyCode != null) {
      currency = currencyCode;
      setDisplayCurrency(currency);
    }
    if (weeklySummary != null) weeklySummaryEnabled = weeklySummary;
    if (budgetAlerts != null) budgetAlertsEnabled = budgetAlerts;
    notifyListeners();
  }

  void toggleBillReminder(String id, bool value) {
    final bill = bills.firstWhere((b) => b.id == id);
    bill.reminderEnabled = value;
    notifyListeners();
  }
}
