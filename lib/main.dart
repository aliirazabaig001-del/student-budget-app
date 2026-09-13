import 'package:flutter/material.dart';
import 'theme.dart';
import 'screens/auth_screens.dart';

void main() {
  runApp(const StudentBudgetApp());
}

class StudentBudgetApp extends StatelessWidget {
  const StudentBudgetApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Student Budget App',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const WelcomeScreen(),
    );
  }
}
