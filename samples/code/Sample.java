import java.util.*;
import java.io.*;

public class Sample {
  public static void main(String args[]) {
    Scanner in = new Scanner(System.in);
    PrintStream out = System.out;

    out.println(in.nextInt() + in.nextInt());

    out.close();
    in.close();
  }
}